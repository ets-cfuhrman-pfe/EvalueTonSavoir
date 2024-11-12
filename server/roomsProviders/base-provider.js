/**
 * @template T
 * @typedef {import('../../types/room').RoomInfo} RoomInfo
 * @typedef {import('../../types/room').RoomOptions} RoomOptions
 * @typedef {import('../../types/room').BaseProviderConfig} BaseProviderConfig
 */

const MIN_NB_SECONDS_BEFORE_CLEANUP = process.env.MIN_NB_SECONDS_BEFORE_CLEANUP || 60

class BaseRoomProvider {
  constructor(config = {}, roomRepository) {
    this.config = config;
    this.roomRepository = roomRepository;

    this.quiz_docker_image = process.env.QUIZROOM_IMAGE || "evaluetonsavoir-quizroom";
    this.quiz_docker_port = process.env.QUIZROOM_PORT || 4500;
    this.quiz_expose_port = process.env.QUIZROOM_EXPOSE_PORT || false;
  }

  async createRoom(roomId, options) {
    throw new Error("Fonction non-implantée - classe abstraite");
  }

  async deleteRoom(roomId) {
    throw new Error("Fonction non-implantée - classe abstraite");
  }

  async getRoomStatus(roomId) {
    throw new Error("Fonction non-implantée - classe abstraite");
  }

  async listRooms() {
    throw new Error("Fonction non-implantée - classe abstraite");
  }

  async cleanup() {
    throw new Error("Fonction non-implantée - classe abstraite");
  }

  async syncInstantiatedRooms(){
    throw new Error("Fonction non-implantée - classe abstraite");
  }

  async updateRoomsInfo() {
    const rooms = await this.roomRepository.getAll();
    for(var room of rooms){
      const url = `${room.host}/health`;
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          room.mustBeCleaned = true;
          await this.roomRepository.update(room);
          continue;
        }
    
        const json = await response.json();
        room.nbStudents = json.connections;
        room.mustBeCleaned = room.nbStudents === 0 && json.uptime >MIN_NB_SECONDS_BEFORE_CLEANUP;

        await this.roomRepository.update(room);
      } catch (error) {
        room.mustBeCleaned = true;
        await this.roomRepository.update(room);
      }
    }
  }

  async getRoomInfo(roomId) {
    const info = await this.roomRepository.get(roomId);
    return info;
  }
}

module.exports = BaseRoomProvider;
