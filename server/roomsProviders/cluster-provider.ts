import * as cluster from 'node:cluster';
import { cpus } from 'node:os';
import { GlideClient } from "@valkey/valkey-glide";
import { 
  ClusterRoomInfo, 
  RoomOptions, 
  ClusterProviderConfig 
} from '../../types/room';
import { BaseRoomProvider } from './base-provider';

export class ClusterRoomProvider extends BaseRoomProvider<ClusterRoomInfo> {
  private workers: Map<number, { rooms: Set<string> }>;

  constructor(valkey: GlideClient, config: ClusterProviderConfig = {}) {
    super(valkey, config);
    this.workers = new Map();

    if (cluster.default.isPrimary) {
      this.initializeCluster();
    }
  }

  private initializeCluster(): void {
    const numCPUs = cpus().length;
    
    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.default.fork();
      this.handleWorkerMessages(worker);
    }

    cluster.default.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died. Starting new worker...`);
      const newWorker = cluster.default.fork();
      this.handleWorkerMessages(newWorker);
    });
  }

  private handleWorkerMessages(worker: cluster.Worker): void {
    worker.on('message', async (msg: { 
      type: string; 
      roomId: string; 
      status: string;
    }) => {
      if (msg.type === 'room_status') {
        await this.updateRoomInfo(msg.roomId, {
          status: msg.status as any,
          workerId: worker.id,
          lastUpdate: Date.now()
        } as Partial<ClusterRoomInfo>);
      }
    });
  }

  async createRoom(roomId: string, options: RoomOptions = {}): Promise<ClusterRoomInfo> {
    const workerLoads = Array.from(this.workers.entries())
      .map(([id, data]) => ({
        id,
        rooms: data.rooms.size
      }))
      .sort((a, b) => a.rooms - b.rooms);

    const workerId = workerLoads[0].id;
    const worker = cluster.default.workers?.[workerId];

    if (!worker) {
      throw new Error('No available workers');
    }

    worker.send({ type: 'create_room', roomId, options });

    const roomInfo: ClusterRoomInfo = {
      roomId,
      provider: 'cluster',
      status: 'creating',
      workerId,
      pid: worker.process.pid!,
      createdAt: Date.now()
    };

    await this.updateRoomInfo(roomId, roomInfo);
    return roomInfo;
  }

  async deleteRoom(roomId: string): Promise<void> {
    const roomInfo = await this.getRoomInfo(roomId) as ClusterRoomInfo;
    if (roomInfo?.workerId && cluster.Worker?.[roomInfo.workerId]) {
      cluster.Worker[roomInfo.workerId].send({ 
        type: 'delete_room', 
        roomId 
      });
    }
    await this.valkey.del(['room',roomId]);
  }

  async getRoomStatus(roomId: string): Promise<ClusterRoomInfo | null> {
    return await this.getRoomInfo(roomId) as ClusterRoomInfo | null;
  }

  async listRooms(): Promise<ClusterRoomInfo[]> {
    const keys = await this.valkey.hkeys('room:*');
    const rooms = await Promise.all(
      keys.map(key => this.getRoomInfo(key.toString().split(':')[1]))
    );
    return rooms.filter((room): room is ClusterRoomInfo => room !== null);
  }

  async cleanup(): Promise<void> {
    const rooms = await this.listRooms();
    const staleTimeout = 30000; // 30 seconds

    for (const room of rooms) {
      if (Date.now() - (room.lastUpdate || room.createdAt) > staleTimeout) {
        await this.deleteRoom(room.roomId);
      }
    }
  }
}