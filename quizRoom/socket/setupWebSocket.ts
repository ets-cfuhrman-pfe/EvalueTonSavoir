import { Server, Socket } from "socket.io";
import os from "os";

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
    
      getMetrics() {
        try {
          // Get CPU usage percentage directly from system
          const cpus = os.cpus();
          const cpuUsage = cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((a, b) => a + b);
            const idle = cpu.times.idle;
            return acc + ((total - idle) / total) * 100;
          }, 0) / cpus.length;
    
          const memoryUsage = process.memoryUsage();
          const mbFactor = 1024 * 1024;
    
          return {
            memoryUsedMB: (memoryUsage.rss / mbFactor).toFixed(2),
            memoryUsedPercentage: (
              (memoryUsage.rss / this.totalSystemMemory) * 100
            ).toFixed(2),
            cpuUsedPercentage: cpuUsage.toFixed(2)
          };
        } catch (error) {
          console.error("Error getting container metrics:", error);
          throw error;
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
