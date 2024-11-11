import http from "http";
import { Server, ServerOptions } from "socket.io";
import { setupWebsocket } from "./socket/setupWebSocket";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const port = 4500;
const roomId = process.env.ROOM_ID; // Load roomId from environment variable
console.log(`I am: /api/room/${roomId}/socket`);

// Create HTTP and WebSocket server
const server = http.createServer();
const ioOptions: Partial<ServerOptions> = {
  path: `/api/room/${roomId}/socket`, // Use roomId from env variable
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
};

const io = new Server(server, ioOptions);

// Initialize WebSocket setup
setupWebsocket(io);

server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`);
});
