const Docker = require("dockerode");
const { Room, RoomRepository } = require("../models/room.js");
const BaseRoomProvider = require("./base-provider.js");

class DockerRoomProvider extends BaseRoomProvider {
  constructor(config, roomRepository) {
    super(config, roomRepository);
    const dockerSocket = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
    
    this.docker = new Docker({ socketPath: dockerSocket });
  }

  async syncInstantiatedRooms(){
    let containers = await this.docker.listContainers();
    containers = containers.filter(container => container.Image === this.quiz_docker_image);

    const containerIds = new Set(containers.map(container => container.Id));

    for (let container of containers) {
      const container_name = container.Names[0].slice(1);
      if (!container_name.startsWith("room_")) {
        console.warn(`Container ${container_name} does not follow the room naming convention, removing it.`);
        const curContainer = this.docker.getContainer(container.Id);
        await curContainer.stop();
        await curContainer.remove();
        containerIds.delete(container.Id);
        console.warn(`Container ${container_name} removed.`);
      }
      else{
        console.warn(`Found orphan container : ${container_name}`);
        const roomId = container_name.slice(5);
        const room = await this.roomRepository.get(roomId);
        
        if (!room) {
          console.warn(`container not our rooms database`);
          const containerInfo = await this.docker.getContainer(container.Id).inspect();
          const containerIP = containerInfo.NetworkSettings.Networks.evaluetonsavoir_quiz_network.IPAddress;
          const host = `${containerIP}:4500`;
          console.warn(`Creating room ${roomId} in our database - host : ${host}`);
          return await this.roomRepository.create(new Room(roomId, container_name, host));
        }

        console.warn(`room ${roomId} already in our database`);
      }
    }
  }

  async createRoom(roomId, options) {
    const container_name = `room_${roomId}`;

    const containerConfig = {
      Image: this.quiz_docker_image,
      name: container_name,
      HostConfig: {
        NetworkMode: "evaluetonsavoir_quiz_network" 
      },
      Env: [...options.env || [], `ROOM_ID=${roomId}`]
    };

    const container = await this.docker.createContainer(containerConfig);
    await container.start();

    const containerInfo = await container.inspect();
    const containerIP = containerInfo.NetworkSettings.Networks.evaluetonsavoir_quiz_network.IPAddress;

    const host = `${containerIP}:${this.quiz_docker_port ?? "4500"}`;
    return await this.roomRepository.create(new Room(roomId, container_name, host, 0));
  }


  async deleteRoom(roomId) {
    const container_name = `room_${roomId}`;
    await this.roomRepository.delete(roomId);

    try {
      const container = this.docker.getContainer(container_name);
      const containerInfo = await container.inspect();

      if (containerInfo) {
        await container.stop();
        await container.remove();
        console.log(`Container for room ${roomId} stopped and removed.`);
      }
    } catch (error) {
      if (error.statusCode === 404) {
        console.warn(`Container for room ${roomId} not found, proceeding to delete room record.`);
      } else {
        console.error(`Error handling container for room ${roomId}:`, error);
        throw new Error("Failed to delete room");
      }
    }
  
    console.log(`Room ${roomId} deleted from repository.`);
  }

  async getRoomStatus(roomId) {
    const room = await this.roomRepository.get(roomId);
    if (!room) return null;

    try {
      const container = this.docker.getContainer(room.containerId || `room_${roomId}`);
      const info = await container.inspect();

      const updatedRoomInfo = {
        ...room,
        status: info.State.Running ? "running" : "terminated",
        containerStatus: {
          Running: info.State.Running,
          StartedAt: info.State.StartedAt,
          FinishedAt: info.State.FinishedAt,
        },
        lastUpdate: Date.now(),
      };

      await this.roomRepository.update(updatedRoomInfo);
      return updatedRoomInfo;
    } catch (error) {
      if (error.statusCode === 404) {
        console.warn(`Container for room ${roomId} not found, room status set to "terminated".`);
        const terminatedRoomInfo = {
          ...room,
          status: "terminated",
          containerStatus: {
            Running: false,
            StartedAt: room.containerStatus?.StartedAt || null,
            FinishedAt: Date.now(),
          },
          lastUpdate: Date.now(),
        };

        await this.roomRepository.update(terminatedRoomInfo);
        return terminatedRoomInfo;
      } else {
        console.error(`Error retrieving container status for room ${roomId}:`, error);
        return null;
      }
    }
  }

  async listRooms() {
    const rooms = await this.roomRepository.getAll();
    return rooms;
  }

  async cleanup() {
    const rooms = await this.roomRepository.getAll();
    for (let room of rooms) {
      if (room.mustBeCleaned) {
        try {
          await this.deleteRoom(room.id);
        } catch (error) {
          console.error(`Error cleaning up room ${room.id}:`, error);
        }
      }
    }

    let containers = await this.docker.listContainers();
    containers = containers.filter(container => container.Image === this.quiz_docker_image);
    const roomIds = rooms.map(room => room.id);

    for (let container of containers) {
      if (!roomIds.includes(container.Names[0].slice(6))) {
        const curContainer = this.docker.getContainer(container.Id);
        await curContainer.stop();
        await curContainer.remove();
        console.warn(`Orphan container ${container.Names[0]} removed.`);
      }
    }
  }
}

module.exports = DockerRoomProvider;
