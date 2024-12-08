import { Server, Socket } from "socket.io";
import Docker from 'dockerode';
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

    interface ContainerStats {
      containerId: string;
      containerName: string;
      memoryUsedMB: number | null;
      memoryUsedPercentage: number | null;
      cpuUsedPercentage: number | null;
      error?: string;
    }

    class ContainerMetrics {
      private docker: Docker;
      private containerName: string;

      private bytesToMB(bytes: number): number {
        return Math.round(bytes / (1024 * 1024));
      }

      constructor() {
        this.docker = new Docker({
          socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock'
        });
        this.containerName = `room_${process.env.ROOM_ID}`;
      }

      private async getContainerNetworks(containerId: string): Promise<string[]> {
        const container = this.docker.getContainer(containerId);
        const info = await container.inspect();
        return Object.keys(info.NetworkSettings.Networks);
      }

      public async getAllContainerStats(): Promise<ContainerStats[]> {
        try {
          // First get our container to find its networks
          const ourContainer = await this.docker.listContainers({
            all: true,
            filters: { name: [this.containerName] }
          });

          if (!ourContainer.length) {
            throw new Error(`Container ${this.containerName} not found`);
          }

          const ourNetworks = await this.getContainerNetworks(ourContainer[0].Id);

          // Get all containers
          const allContainers = await this.docker.listContainers();

          // Get stats for containers on the same networks
          const containerStats = await Promise.all(
            allContainers.map(async (container): Promise<ContainerStats | null> => {
              try {
                const containerNetworks = await this.getContainerNetworks(container.Id);
                // Check if container shares any network with our container
                if (!containerNetworks.some(network => ourNetworks.includes(network))) {
                  return null;
                }
          
                const stats = await this.docker.getContainer(container.Id).stats({ stream: false });
          
                const memoryStats = {
                  usage: stats.memory_stats.usage,
                  limit: stats.memory_stats.limit || 0,
                  percent: stats.memory_stats.limit ? (stats.memory_stats.usage / stats.memory_stats.limit) * 100 : 0
                };
          
                const cpuDelta = stats.cpu_stats?.cpu_usage?.total_usage - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
                const systemDelta = stats.cpu_stats?.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0);
                const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * (stats.cpu_stats?.online_cpus || 1) * 100 : 0;
          
                return {
                  containerId: container.Id,
                  containerName: container.Names[0].replace(/^\//, ''),
                  memoryUsedMB: this.bytesToMB(memoryStats.usage),
                  memoryUsedPercentage: memoryStats.percent,
                  cpuUsedPercentage: cpuPercent
                };
              } catch (error) {
                return {
                  containerId: container.Id,
                  containerName: container.Names[0].replace(/^\//, ''),
                  memoryUsedMB: null,
                  memoryUsedPercentage: null,
                  cpuUsedPercentage: null,
                  error: error instanceof Error ? error.message : String(error)
                };
              }
            })
          );
          
          // Change the filter to use proper type predicate
          return containerStats.filter((stats): stats is ContainerStats => stats !== null);
        } catch (error) {
          console.error('Stats error:', error);
          return [{
            containerId: 'unknown',
            containerName: 'unknown',
            memoryUsedMB: null,
            memoryUsedPercentage: null,
            cpuUsedPercentage: null,
            error: error instanceof Error ? error.message : String(error)
          }];
        }
      }
    }

    const containerMetrics = new ContainerMetrics();

    socket.on("get-usage", async () => {
      try {
        const usageData = await containerMetrics.getAllContainerStats();
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
