import http from "http";
import { Server, ServerOptions } from "socket.io";

// Import setupWebsocket
import { setupWebsocket } from "./socket/setupWebSocket";

const port =  4500;

// Create HTTP and WebSocket server
const server = http.createServer();
const ioOptions: Partial<ServerOptions> = {
  path: '/api/room/975239/socket', // TODO : use env variable to set room id
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
