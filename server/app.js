// Import API
const express = require("express");
const http = require("http");
const dotenv = require('dotenv');

// Import Sockets
const { setupWebsocket } = require("./socket/socket");
const { Server } = require("socket.io");

// instantiate the db
const db = require('./config/db.js');
// instantiate the models
const quiz = require('./models/quiz.js');
const quizModel = new quiz(db);
const folders = require('./models/folders.js');
const foldersModel = new folders(db, quizModel);
const users = require('./models/users.js');
const userModel = new users(db, foldersModel);
const images = require('./models/images.js');
const imageModel = new images(db);

// instantiate the controllers
const usersController = require('./controllers/users.js');
const usersControllerInstance = new usersController(userModel);
const foldersController = require('./controllers/folders.js');
const foldersControllerInstance = new foldersController(foldersModel);
const quizController = require('./controllers/quiz.js');
const quizControllerInstance = new quizController(quizModel, foldersModel);
const imagesController = require('./controllers/images.js');
const imagesControllerInstance = new imagesController(imageModel);

// export the controllers
module.exports.users = usersControllerInstance;
module.exports.folders = foldersControllerInstance;
module.exports.quizzes = quizControllerInstance;
module.exports.images = imagesControllerInstance;

//import routers (instantiate controllers as side effect)
const userRouter = require('./routers/users.js');
const folderRouter = require('./routers/folders.js');
const quizRouter = require('./routers/quiz.js');
const imagesRouter = require('./routers/images.js')
const AuthManager = require('./auth/auth-manager.js')
const authRouter = require('./routers/auth.js')

// Setup environment
dotenv.config();

// Setup urls from configs
const use_ports = (process.env['USE_PORTS'] || 'false').toLowerCase() == "true"
process.env['FRONTEND_URL'] = process.env['SITE_URL']  + (use_ports ? `:${process.env['FRONTEND_PORT']}`:"")
process.env['BACKEND_URL'] = process.env['SITE_URL']  + (use_ports ? `:${process.env['PORT']}`:"")

const errorHandler = require("./middleware/errorHandler.js");

// Start app
const app = express();
const cors = require("cors");
const bodyParser = require('body-parser');
let isDev = process.env.NODE_ENV === 'development';

const configureServer = (httpServer, isDev) => {
  console.log(`Configuring server with isDev: ${isDev}`);
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

console.log(`Environnement: ${process.env.NODE_ENV} (${isDev ? 'dev' : 'prod'})`);

const io = configureServer(server, isDev);
console.log(`Server configured with cors.origin: ${io.opts.cors.origin} and secure: ${io.opts.secure}`);

setupWebsocket(io);
console.log(`Websocket setup with on() listeners.`);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Create routes
app.use('/api/user', userRouter);
app.use('/api/folder', folderRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/image', imagesRouter);
app.use('/api/auth', authRouter);

// Add Auths methods
const session = require('express-session');
app.use(session({
  secret: process.env['SESSION_Secret'],
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

authManager = new AuthManager(app,null,userModel)
app.use(errorHandler)

// Start server
async function start() {
  const port = process.env.PORT || 4400;

  // Check DB connection
  await db.connect();
  db.getConnection();
  console.log(`Connexion MongoDB établie`);

  server.listen(port, () => {
    console.log(`Serveur écoutant sur le port ${port}`);
  });
}

start();
