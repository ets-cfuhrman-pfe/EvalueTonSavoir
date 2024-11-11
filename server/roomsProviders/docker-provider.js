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
      Image: 'evaluetonsavoir-quizroom', // Your local Docker image name
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
      Env: options.env || []
    };

    // Use `this.docker` instead of `docker`
    const container = await this.docker.createContainer(containerConfig);
    await container.start();

    const containerInfo = await container.inspect();
    const containerIP = containerInfo.NetworkSettings.IPAddress;
    const host = `${containerIP}:4500`;

    return await this.roomRepository.create(new Room(roomId, container_name, host, 0));
  }

  async deleteRoom(roomId) {
    return await this.roomRepository.delete(roomId); // Short-circuit -- not implemented yet
    try {
      const container = this.docker.getContainer(roomId);
      await container.stop();
      await container.remove();

      await this.roomRepository.delete(roomId);
      console.log(`Conteneur pour la salle ${roomId} supprimé.`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du conteneur pour la salle ${roomId}:`, error);
      throw new Error("Failed to delete room");
    }
  }

  async getRoomStatus(roomId) {
    const room = await this.roomRepository.get(roomId);
    if (!room) return null;

    return room; // Short-circuit -- not implemented yet

    try {
      const container = this.docker.getContainer(room.containerId);
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
      console.error(`Erreur lors de la récupération du statut du conteneur pour la salle ${roomId}:`, error);
      return null;
    }
  }

  async listRooms() {
    const rooms = await this.roomRepository.getAll();
    return rooms;
  }

  async cleanup() {
    /*
    const rooms = await this.listRooms();
    for (const room of rooms) {
      if(room.nbStudents == 0){
        await this.deleteRoom(room.roomId);
      }
    }
    console.log("Nettoyage des salles terminé.");
    */
  }
}

module.exports = DockerRoomProvider;
