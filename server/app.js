// Import API
const express = require("express");
const http = require("http");

// Import environment configuration (replaces dotenv)
const envConfig = require('./config/environment');

// Import Sockets
const { setupWebsocket } = require("./socket/socket");
const { Server } = require("socket.io");

// instantiate the db
const db = require('./config/db.js');
// instantiate the models
const quiz = require('./models/quiz.js');
const quizModel = new quiz(db);
const room = require('./models/room.js');
const roomModel = new room(db);
const folders = require('./models/folders.js');
const foldersModel = new folders(db, quizModel);
const users = require('./models/users.js');
const userModel = new users(db, foldersModel);
const images = require('./models/images.js');
const imageModel = new images(db);

// instantiate the controllers
const usersController = require('./controllers/users.js');
const usersControllerInstance = new usersController(userModel);
const roomsController = require('./controllers/room.js');
const roomsControllerInstance = new roomsController(roomModel);
const foldersController = require('./controllers/folders.js');
const foldersControllerInstance = new foldersController(foldersModel);
const quizController = require('./controllers/quiz.js');
const quizControllerInstance = new quizController(quizModel, foldersModel);
const imagesController = require('./controllers/images.js');
const imagesControllerInstance = new imagesController(imageModel);

// export the controllers
module.exports.users = usersControllerInstance;
module.exports.rooms = roomsControllerInstance;
module.exports.folders = foldersControllerInstance;
module.exports.quizzes = quizControllerInstance;
module.exports.images = imagesControllerInstance;

//import routers (instantiate controllers as side effect)
const userRouter = require('./routers/users.js');
const roomRouter = require('./routers/room.js');
const folderRouter = require('./routers/folders.js');
const quizRouter = require('./routers/quiz.js');
const imagesRouter = require('./routers/images.js')
const AuthManager = require('./auth/auth-manager.js')
const authRouter = require('./routers/auth.js')

const errorHandler = require("./middleware/errorHandler.js");
const logger = require('./config/logger');
const httpLogger = require('./config/httpLogger');
const loggingMiddleware = require('./middleware/logging');

// Log environment configuration
envConfig.logConfig();

// Start app
const app = express();
const cors = require("cors");
const bodyParser = require('body-parser');
const isDev = envConfig.get('isDevelopment');

const configureServer = (httpServer, isDev) => {
  logger.info(`Configuring server with isDev: ${isDev}`);
  return new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    secure: !isDev, // true for https, false for http
  });
};

// Start sockets (depending on the dev or prod environment)
const server = http.createServer(app);

logger.info(`Environment: ${envConfig.get('NODE_ENV')} (${isDev ? 'dev' : 'prod'})`);

const io = configureServer(server, isDev);
logger.info(`Server configured with cors.origin: ${io.opts.cors.origin} and secure: ${io.opts.secure}`);

setupWebsocket(io);
logger.info(`Websocket setup with on() listeners`);

// Apply logging middleware early in the stack
app.use(httpLogger.requestIdMiddleware);
app.use(httpLogger.middleware);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Add comprehensive logging middleware after body parsing
app.use(loggingMiddleware.comprehensiveLogging);

// Create routes
app.use('/api/user', userRouter);
app.use('/api/room', roomRouter);
app.use('/api/folder', folderRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/image', imagesRouter);
app.use('/api/auth', authRouter);

// Add Auths methods
const session = require('express-session');
app.use(session({
  secret: envConfig.get('SESSION_SECRET'),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: envConfig.get('isProduction') }
}));

let _authManager = new AuthManager(app,null,userModel);
app.use(errorHandler);

// Start server
async function start() {
  const port = envConfig.get('PORT');

  try {
    // Check DB connection
    await db.connect();
    db.getConnection();
    logger.info('MongoDB connection established');

    server.listen(port, () => {
      logger.info(`Server listening on port ${port}`, {
        port,
        environment: envConfig.get('NODE_ENV'),
        nodeVersion: process.version
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  try {
    await db.closeConnection();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
});

start();
