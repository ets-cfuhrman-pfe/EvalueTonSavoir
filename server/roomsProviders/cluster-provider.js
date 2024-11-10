const cluster = require("node:cluster");
const { cpus } = require("node:os");
const BaseRoomProvider = require("./base-provider.js");

class ClusterRoomProvider extends BaseRoomProvider {
  constructor(config = {}, roomRepository) {
    super(config, roomRepository);
    this.workers = new Map();

    if (cluster.isPrimary) {
      this.initializeCluster();
    }
  }

  initializeCluster() {
    const numCPUs = cpus().length;

    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.fork();
      this.handleWorkerMessages(worker);
    }

    cluster.on("exit", (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died. Starting new worker...`);
      const newWorker = cluster.fork();
      this.handleWorkerMessages(newWorker);
    });
  }

  handleWorkerMessages(worker) {
    worker.on("message", async (msg) => {
      if (msg.type === "room_status") {
        await this.updateRoomInfo(msg.roomId, {
          status: msg.status,
          workerId: worker.id,
          lastUpdate: Date.now(),
        });
      }
    });
  }

  async createRoom(roomId, options = {}) {
    const workerLoads = Array.from(this.workers.entries())
      .map(([id, data]) => ({
        id,
        rooms: data.rooms.size,
      }))
      .sort((a, b) => a.rooms - b.rooms);

    const workerId = workerLoads[0].id;
    const worker = cluster.workers[workerId];

    if (!worker) {
      throw new Error("No available workers");
    }

    worker.send({ type: "create_room", roomId, options });

    const roomInfo = {
      roomId,
      provider: "cluster",
      status: "creating",
      workerId,
      pid: worker.process.pid,
      createdAt: Date.now(),
    };

    await this.updateRoomInfo(roomId, roomInfo);
    return roomInfo;
  }

  async deleteRoom(roomId) {
    const roomInfo = await this.getRoomInfo(roomId);
    if (roomInfo?.workerId && cluster.workers[roomInfo.workerId]) {
      cluster.workers[roomInfo.workerId].send({
        type: "delete_room",
        roomId,
      });
    }
    //await this.valkey.del(["room", roomId]);
  }

  async getRoomStatus(roomId) {
    return await this.getRoomInfo(roomId);
  }

  async listRooms() {
    let rooms = [];
    /*
    const keys = await this.valkey.hkeys("room:*");
    const rooms = await Promise.all(
      keys.map((key) => this.getRoomInfo(key.split(":")[1]))
    );
    */
    return rooms.filter((room) => room !== null);
  }

  async cleanup() {
    const rooms = await this.listRooms();
    const staleTimeout = 30000;

    for (const room of rooms) {
      if (Date.now() - (room.lastUpdate || room.createdAt) > staleTimeout) {
        await this.deleteRoom(room.roomId);
      }
    }
  }
}

module.exports = ClusterRoomProvider;
