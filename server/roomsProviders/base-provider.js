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
  }

  async createRoom(roomId, options) {
    throw new Error("Method not implemented");
  }

  async deleteRoom(roomId) {
    throw new Error("Method not implemented");
  }

  async getRoomStatus(roomId) {
    throw new Error("Method not implemented");
  }

  async listRooms() {
    throw new Error("Method not implemented");
  }

  async cleanup() {
    throw new Error("Method not implemented");
  }

  async syncInstantiatedRooms(){
    throw new Error("Method not implemented");
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
        console.error(`Error updating room ${room.id}:`, error);
      }
    }
  }

  async getRoomInfo(roomId) {
    const info = await this.roomRepository.get(roomId);
    return info;
  }
}

module.exports = BaseRoomProvider;
