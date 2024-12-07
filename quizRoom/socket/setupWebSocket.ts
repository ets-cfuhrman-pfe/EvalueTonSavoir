import { Server, Socket } from "socket.io";
import os from "os";
import fs from 'fs';

const MAX_USERS_PER_ROOM = 60;
const MAX_TOTAL_CONNECTIONS = 2000;

export const setupWebsocket = (io: Server): void => {
  let totalConnections = 0;

  io.on("connection", (socket: Socket) => {
    if (totalConnections >= MAX_TOTAL_CONNECTIONS) {
      console.log("Connection limit reached. Disconnecting client.");
      socket.emit("join-failure", "Le nombre maximum de connexions a été atteint");
      socket.disconnect(true);
      return;
    }

    totalConnections++;
    console.log("A user connected:", socket.id, "| Total connections:", totalConnections);

    socket.on("create-room", (sentRoomName) => {
      // Ensure sentRoomName is a string before applying toUpperCase()
      const roomName = (typeof sentRoomName === "string" && sentRoomName.trim() !== "")
        ? sentRoomName.toUpperCase()
        : generateRoomName();

      console.log(`Created room with name: ${roomName}`);
      if (!io.sockets.adapter.rooms.get(roomName)) {
        socket.join(roomName);
        socket.emit("create-success", roomName);
      } else {
        socket.emit("create-failure");
      }
    });

    socket.on("join-room", ({ enteredRoomName, username }: { enteredRoomName: string; username: string }) => {
      if (io.sockets.adapter.rooms.has(enteredRoomName)) {
        const clientsInRoom = io.sockets.adapter.rooms.get(enteredRoomName)?.size || 0;

        if (clientsInRoom <= MAX_USERS_PER_ROOM) {
          socket.join(enteredRoomName);
          socket.to(enteredRoomName).emit("user-joined", { id: socket.id, name: username, answers: [] });
          socket.emit("join-success");
        } else {
          socket.emit("join-failure", "La salle est remplie");
        }
      } else {
        socket.emit("join-failure", "Le nom de la salle n'existe pas");
      }
    });

    socket.on("next-question", ({ roomName, question }: { roomName: string; question: string }) => {
      socket.to(roomName).emit("next-question", question);
    });

    socket.on("launch-student-mode", ({ roomName, questions }: { roomName: string; questions: string[] }) => {
      socket.to(roomName).emit("launch-student-mode", questions);
    });

    socket.on("end-quiz", ({ roomName }: { roomName: string }) => {
      socket.to(roomName).emit("end-quiz");
    });

    socket.on("message", (data: string) => {
      console.log("Received message from", socket.id, ":", data);
    });

    socket.on("disconnect", () => {
      totalConnections--;
      console.log("A user disconnected:", socket.id, "| Total connections:", totalConnections);

      for (const [room] of io.sockets.adapter.rooms) {
        if (room !== socket.id) {
          io.to(room).emit("user-disconnected", socket.id);
        }
      }
    });

    socket.on("submit-answer", ({
      roomName,
      username,
      answer,
      idQuestion,
    }: {
      roomName: string;
      username: string;
      answer: string;
      idQuestion: string;
    }) => {
      socket.to(roomName).emit("submit-answer-room", {
        idUser: socket.id,
        username,
        answer,
        idQuestion,
      });
    });

    socket.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });


    // Stress Testing

    socket.on("message-from-teacher", ({ roomName, message }: { roomName: string; message: string }) => {
      console.log(`Message reçu dans la salle ${roomName} : ${message}`);
      socket.to(roomName).emit("message-sent-teacher", { message });
    });

    socket.on("message-from-student", ({ roomName, message }: { roomName: string; message: string }) => {
      console.log(`Message reçu dans la salle ${roomName} : ${message}`);
      socket.to(roomName).emit("message-sent-student", { message });
    });

    class ContainerMetrics {
      private totalSystemMemory = os.totalmem();
      private cgroupv2 = this.isCgroupV2();
      private lastCPUUsage = 0;
      private lastCPUTime = Date.now();

      private isCgroupV2(): boolean {
        return fs.existsSync('/sys/fs/cgroup/cgroup.controllers');
      }

      private readCgroupFile(filepath: string): string {
        try {
          return fs.readFileSync(filepath, 'utf-8').trim();
        } catch (error) {
          console.debug(`Could not read ${filepath}`);
          return '';
        }
      }

      private getCgroupCPUUsage(): number {
        try {
          if (this.cgroupv2) {
            const usage = this.readCgroupFile('/sys/fs/cgroup/cpu.stat');
            const usageMatch = usage.match(/usage_usec\s+(\d+)/);
            if (usageMatch) {
              const currentUsage = Number(usageMatch[1]) / 1000000;
              const currentTime = Date.now();
              const cpuDelta = currentUsage - this.lastCPUUsage;
              const timeDelta = (currentTime - this.lastCPUTime) / 1000;
              
              this.lastCPUUsage = currentUsage;
              this.lastCPUTime = currentTime;
              
              return (cpuDelta / timeDelta) * 100;
            }
          }
    
          const cgroupV1Paths = [
            '/sys/fs/cgroup/cpu/cpuacct.usage',
            '/sys/fs/cgroup/cpuacct/cpuacct.usage',
            '/sys/fs/cgroup/cpu,cpuacct/cpuacct.usage'
          ];
    
          for (const path of cgroupV1Paths) {
            const usage = this.readCgroupFile(path);
            if (usage) {
              const currentUsage = Number(usage) / 1000000000;
              const currentTime = Date.now();
              const cpuDelta = currentUsage - this.lastCPUUsage;
              const timeDelta = (currentTime - this.lastCPUTime) / 1000;
              
              this.lastCPUUsage = currentUsage;
              this.lastCPUTime = currentTime;
              
              return (cpuDelta / timeDelta) * 100;
            }
          }
    
          return this.getFallbackCPUUsage();
        } catch (error) {
          return this.getFallbackCPUUsage();
        }
      }

      private getFallbackCPUUsage(): number {
        try {
          const cpus = os.cpus();
          return cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((a, b) => a + b);
            const idle = cpu.times.idle;
            return acc + ((total - idle) / total) * 100;
          }, 0) / cpus.length;
        } catch (error) {
          console.error('Error getting fallback CPU usage:', error);
          return 0;
        }
      }

      private getCgroupMemoryUsage(): { used: number; limit: number } | null {
        try {
          // First get process memory as baseline
          const processMemory = process.memoryUsage();
          const baselineMemory = processMemory.rss;

          if (this.cgroupv2) {
            const memUsage = Number(this.readCgroupFile('/sys/fs/cgroup/memory.current'));
            if (!isNaN(memUsage) && memUsage > 0) {
              return {
                used: Math.max(baselineMemory, memUsage),
                limit: this.totalSystemMemory
              };
            }
          }

          // Try cgroup v1
          const v1Paths = {
            usage: '/sys/fs/cgroup/memory/memory.usage_in_bytes',
            limit: '/sys/fs/cgroup/memory/memory.limit_in_bytes'
          };

          const memoryUsage = Number(this.readCgroupFile(v1Paths.usage));
          if (!isNaN(memoryUsage) && memoryUsage > 0) {
            return {
              used: Math.max(baselineMemory, memoryUsage),
              limit: this.totalSystemMemory
            };
          }

          // Fallback to process memory
          return {
            used: baselineMemory,
            limit: this.totalSystemMemory
          };

        } catch (error) {
          console.debug('Error reading cgroup memory:', error);
          return null;
        }
      }

      public getMetrics() {
        try {
          const mbFactor = 1024 * 1024;
          let memoryData = this.getCgroupMemoryUsage();

          if (!memoryData) {
            const processMemory = process.memoryUsage();
            memoryData = {
              used: processMemory.rss,
              limit: this.totalSystemMemory
            };
          }

          const memoryUsedMB = memoryData.used / mbFactor;
          const memoryTotalMB = memoryData.limit / mbFactor;
          const memoryPercentage = (memoryData.used / memoryData.limit) * 100;

          console.debug(`
            Memory Usage: ${memoryUsedMB.toFixed(2)} MB
            Memory Total: ${memoryTotalMB.toFixed(2)} MB
            Memory %: ${memoryPercentage.toFixed(2)}%
          `);

          return {
            memoryUsedMB: memoryUsedMB.toFixed(2),
            memoryUsedPercentage: memoryPercentage.toFixed(2),
            cpuUsedPercentage: this.getCgroupCPUUsage().toFixed(2)
          };
        } catch (error) {
          console.error("Error getting metrics:", error);
          return {
            memoryUsedMB: "0",
            memoryUsedPercentage: "0",
            cpuUsedPercentage: "0"
          };
        }
      }
    }

    // Usage in WebSocket setup
    const containerMetrics = new ContainerMetrics();

    socket.on("get-usage", () => {
      try {
        const usageData = containerMetrics.getMetrics();
        socket.emit("usage-data", usageData);
      } catch (error) {
        socket.emit("error", { message: "Failed to retrieve usage data" });
      }
    });

  });

  const generateRoomName = (length = 6): string => {
    const characters = "0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
};
