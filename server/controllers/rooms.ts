import { GlideClient } from '@valkey/valkey-glide';
import { 
  RoomInfo,
  RoomOptions,
  ProviderType,
  ProviderConfig
} from '../../types/room';
import { BaseRoomProvider } from '../roomsProviders/base-provider';
import { ClusterRoomProvider } from '../roomsProviders/cluster-provider';
//import { DockerRoomProvider } from '../roomsProviders/docker-provider';
//import { KubernetesRoomProvider } from '../roomsProviders/kubernetes-provider';

interface RoomManagerOptions {
  provider?: ProviderType;
  providerOptions?: ProviderConfig;
}

export class RoomManager {
  private valkey: GlideClient;
  private provider: BaseRoomProvider<RoomInfo>;

  constructor(options: RoomManagerOptions = {}, valkeyClient:GlideClient) {
    this.valkey = valkeyClient;
    this.provider = this.createProvider(
      options.provider || process.env.ROOM_PROVIDER as ProviderType || 'cluster',
      options.providerOptions
    );
    
    this.setupCleanup();
  }

  private createProvider(
    type: ProviderType, 
    options?: ProviderConfig
  ): BaseRoomProvider<RoomInfo> {
    switch (type) {
      case 'cluster':
        return new ClusterRoomProvider(this.valkey, options);
        /*
      case 'docker':
        return new DockerRoomProvider(this.redis, options);
      case 'kubernetes':
        return new KubernetesRoomProvider(this.redis, options);
        */
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  private setupCleanup(): void {
    setInterval(() => {
      this.provider.cleanup().catch(console.error);
    }, 30000);
  }

  async createRoom(options: RoomOptions = {}): Promise<RoomInfo> {
    const roomId = options.roomId || this.generateRoomId();
    return await this.provider.createRoom(roomId, options);
  }

  async deleteRoom(roomId: string): Promise<void> {
    return await this.provider.deleteRoom(roomId);
  }

  async getRoomStatus(roomId: string): Promise<RoomInfo | null> {
    return await this.provider.getRoomStatus(roomId);
  }

  async listRooms(): Promise<RoomInfo[]> {
    return await this.provider.listRooms();
  }

  private generateRoomId(): string {
    return `room-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = RoomManager;