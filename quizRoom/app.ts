import http from "http";
import { Server, ServerOptions } from "socket.io";

// Import setupWebsocket
import { setupWebsocket } from "./socket/setupWebSocket";

const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 4500;

// Create HTTP and WebSocket server
const server = http.createServer();
const ioOptions: Partial<ServerOptions> = {
  path: "/socket.io",
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
