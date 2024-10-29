import { GlideClient, GlideString } from "@valkey/valkey-glide";
import { RoomInfo, RoomOptions, BaseProviderConfig } from '../../types/room';

export abstract class BaseRoomProvider<T extends RoomInfo> {
  protected valkey: GlideClient;

  constructor(valkey: GlideClient, protected config: BaseProviderConfig = {}) {
    this.valkey = valkey;
  }

  abstract createRoom(roomId: string, options?: RoomOptions): Promise<T>;
  abstract deleteRoom(roomId: string): Promise<void>;
  abstract getRoomStatus(roomId: string): Promise<T | null>;
  abstract listRooms(): Promise<T[]>;
  abstract cleanup(): Promise<void>;

  protected async updateRoomInfo(roomId: string, info: Partial<RoomInfo>): Promise<boolean> {
    let room = await this.getRoomInfo(roomId);
    
    if(!room) return false;

    for(let key in Object.keys(room)){
      room[key]= info[key];
    }

    const result = await this.valkey.set(`room:${roomId}`,room as Object as GlideString);
    return result != null;
  }

  protected async getRoomInfo(roomId: string): Promise<RoomInfo | null> {
    const info = (await this.valkey.get(`room:${roomId}`)) as RoomInfo | null;
    return info;
  }
}