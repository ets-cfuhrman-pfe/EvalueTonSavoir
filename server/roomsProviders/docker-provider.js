const Docker = require("dockerode");
const { Room, RoomRepository } = require("../models/room.js");
const BaseRoomProvider = require("./base-provider.js");

class DockerRoomProvider extends BaseRoomProvider {
  constructor(config, roomRepository) {
    super(config, roomRepository);
    this.docker = new Docker({ socketPath: "/var/run/docker.sock" });
  }

  async createRoom(roomId, options) {
    const host = "localhost:4500";
    const id = await this.roomRepository.create(
      new Room(roomId, roomId, host, 0)
    );
    return roomRepository.get(id);
  }

  async deleteRoom(roomId) {
    try {
      const container = this.docker.getContainer(roomId);
      await container.stop();
      await container.remove();

      await roomRepository.delete(roomId);
      console.log(`Conteneur pour la salle ${roomId} supprimé.`);
    } catch (error) {
      console.error(
        `Erreur lors de la suppression du conteneur pour la salle ${roomId}:`,
        error
      );
      throw new Error("Failed to delete room");
    }
  }

  async getRoomStatus(roomId) {
    const room = await roomRepository.get(roomId);
    if (!room) return null;

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
      console.error(
        `Erreur lors de la récupération du statut du conteneur pour la salle ${roomId}:`,
        error
      );
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
