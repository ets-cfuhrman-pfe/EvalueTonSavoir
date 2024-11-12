import http from "http";
import { Server, ServerOptions } from "socket.io";
import { setupWebsocket } from "./socket/setupWebSocket";
import dotenv from "dotenv";
import express from 'express';

// Load environment variables
dotenv.config();

const port = process.env.PORT || 4500;
const roomId = process.env.ROOM_ID;
console.log(`I am: /api/room/${roomId}/socket`);

// Create Express app for health check
const app = express();
const server = http.createServer(app);

// Health check endpoint
app.get('/health', (_, res) => {
  try {
    if (io.engine?.clientsCount !== undefined) {
      res.status(200).json({
        status: 'healthy',
        path: `/api/room/${roomId}/socket`,
        connections: io.engine.clientsCount,
        uptime: process.uptime()
      });
    } else {
      throw new Error('Socket.io server not initialized');
    }
  } catch (error: Error | any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

const ioOptions: Partial<ServerOptions> = {
  path: `/api/room/${roomId}/socket`,
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