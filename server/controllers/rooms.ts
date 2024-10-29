import { Redis } from 'ioredis';
import { 
  RoomInfo,
  RoomOptions,
  ProviderType,
  ProviderConfig
} from '../../types/room';
import { BaseRoomProvider } from './providers/base-provider';
import { ClusterRoomProvider } from './providers/cluster-provider';
import { DockerRoomProvider } from './providers/docker-provider';
import { KubernetesRoomProvider } from './providers/kubernetes-provider';

interface RoomManagerOptions {
  redisUrl?: string;
  provider?: ProviderType;
  providerOptions?: ProviderConfig;
}

export class RoomManager {
  private redis: Redis;
  private provider: BaseRoomProvider<RoomInfo>;

  constructor(options: RoomManagerOptions = {}) {
    this.redis = new Redis(options.redisUrl || process.env.REDIS_URL);
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
        return new ClusterRoomProvider(this.redis, options);
      case 'docker':
        return new DockerRoomProvider(this.redis, options);
      case 'kubernetes':
        return new KubernetesRoomProvider(this.redis, options);
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