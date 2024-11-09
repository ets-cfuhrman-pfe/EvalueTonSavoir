import express, { Application } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ServerOptions, Server as SocketIOServer } from 'socket.io';
import { GlideClient } from '@valkey/valkey-glide';

// Set app defaults
const environment: string = process.env.NODE_ENV ?? "production";
const isDev: boolean = environment === "development";

// Import Sockets
import setupWebsocket from "./socket/socket";

// Import Database
import db from './config/db';

// Import Models
import Quiz from './models/quiz';
import Folders from './models/folders';
import Users from './models/users';
import Images from './models/images';

// Instantiate models
const quizModel = new Quiz(db);
const foldersModel = new Folders(db, quizModel);
const userModel = new Users(db, foldersModel);
const imageModel = new Images(db);

// Initialize cache
const valkey = await GlideClient.createClient({
  addresses: [{
    host: process.env.VALKEY_HOST ?? 'localhost',
    port: Number(process.env.VALKEY_PORT) ?? 6379
  }]
});

// Import Controllers
import UsersController from './controllers/users';
import FoldersController from './controllers/folders';
import QuizController from './controllers/quiz';
import ImagesController from './controllers/images';
import { RoomManager as RoomsController } from './controllers/rooms';

// Instantiate Controllers
const usersControllerInstance = new UsersController(userModel);
const foldersControllerInstance = new FoldersController(foldersModel);
const quizControllerInstance = new QuizController(quizModel, foldersModel);
const imagesControllerInstance = new ImagesController(imageModel);

// Initialize valkey before creating rooms controller
const roomsControllerInstance = new RoomsController({}, valkey);


// Export Controllers
export const controllers = {
  users: usersControllerInstance,
  folders: foldersControllerInstance,
  quizzes: quizControllerInstance,
  images: imagesControllerInstance,
  rooms: roomsControllerInstance
};

// Import Routers
import userRouter from './routers/users';
import folderRouter from './routers/folders';
import quizRouter from './routers/quiz';
import imagesRouter from './routers/images';

// Setup environment
dotenv.config();
import errorHandler from "./middleware/errorHandler";

// Start app
const app: Application = express();

const configureServer = (httpServer: http.Server, isDev: boolean): SocketIOServer => {

  isDev
  const options: Partial<ServerOptions> = {
    path: "/socket.io",
    cors: {
      origin: "*", // Not secure -- to
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  };

  return new SocketIOServer(httpServer, options);
};

// Create HTTP server
const server: http.Server = http.createServer(app);

console.log(`Environment: ${process.env.NODE_ENV} (${isDev ? 'dev' : 'prod'})`);

const io: SocketIOServer = configureServer(server, isDev);

setupWebsocket(io);

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use('/api/user', userRouter);
app.use('/api/folder', folderRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/image', imagesRouter);

// Error handling
app.use(errorHandler);

// Server startup function
const start = async (): Promise<void> => {
  const port: number = Number(process.env.PORT) || 4400;

  try {
    // Check DB connection
    await db.connect();
    db.getConnection();
    console.log('MongoDB connection established');

    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
