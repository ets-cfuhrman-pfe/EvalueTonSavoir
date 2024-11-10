/**
 * @template T
 * @typedef {import('../../types/room').RoomInfo} RoomInfo
 * @typedef {import('../../types/room').RoomOptions} RoomOptions
 * @typedef {import('../../types/room').BaseProviderConfig} BaseProviderConfig
 */

class BaseRoomProvider {
  constructor(config = {}, roomRepository) {
    this.config = config;
    this.roomRepository = roomRepository;
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

  async updateRoomInfo(roomId, info) {
    let room = await this.getRoomInfo(roomId);

    if (!room) return false;

    for (let key of Object.keys(room)) {
      if (info[key] !== undefined) {
        room[key] = info[key];
      }
    }

    const result = await this.roomRepository.update(room);
    return result != null;
  }

  async getRoomInfo(roomId) {
    const info = await this.roomRepository.get(roomId);
    return info;
  }
}

module.exports = BaseRoomProvider;
