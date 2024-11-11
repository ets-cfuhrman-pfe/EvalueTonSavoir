const Docker = require("dockerode");
const { Room, RoomRepository } = require("../models/room.js");
const BaseRoomProvider = require("./base-provider.js");

class DockerRoomProvider extends BaseRoomProvider {
  constructor(config, roomRepository) {
    super(config, roomRepository);
    this.docker = new Docker({ socketPath: "/var/run/docker.sock" });
  }

  async createRoom(roomId, options) {
    const container_name = `room_${roomId}`;

    const containerConfig = {
      Image: 'evaluetonsavoir-quizroom',
      name: container_name,
      ExposedPorts: {
        "4500/tcp": {}
      },
      HostConfig: {
        PortBindings: {
          "4500/tcp": [
            {
              HostPort: ""
            }
          ]
        }
      },
      Env: [...options.env || [], `ROOM_ID=${roomId}`]
    };

    const container = await this.docker.createContainer(containerConfig);
    await container.start();

    const containerInfo = await container.inspect();
    const containerIP = containerInfo.NetworkSettings.IPAddress;

    const host = `${containerIP}:4500`;
    return await this.roomRepository.create(new Room(roomId, container_name, host, 0));
  }


  async deleteRoom(roomId) {
    const container_name = `room_${roomId}`;

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

    await this.roomRepository.delete(roomId);
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
    const roomIds = new Set(rooms.map(room => room.id));

    const containers = await this.docker.listContainers({ all: true });
    const containerIds = new Set();

    for (const containerInfo of containers) {
      const containerName = containerInfo.Names[0].replace("/", "");
      if (containerName.startsWith("room_")) {
        const roomId = containerName.split("_")[1];
        containerIds.add(roomId);

        if (!roomIds.has(roomId)) {
          try {
            const container = this.docker.getContainer(containerInfo.Id);
            await container.stop();
            await container.remove();
            console.log(`Loose container ${containerName} deleted.`);
          } catch (error) {
            console.error(`Failed to delete loose container ${containerName}:`, error);
          }
        }
      }
    }

    for (const room of rooms) {
      if (!containerIds.has(room.id)) {
        try {
          await this.roomRepository.delete(room.id);
          console.log(`Orphan room ${room.id} deleted from repository.`);
        } catch (error) {
          console.error(`Failed to delete orphan room ${room.id} from repository:`, error);
        }
      }
    }

    console.log("Cleanup of loose containers and orphan rooms completed.");
  }

}

module.exports = DockerRoomProvider;
