// Import API
const express = require("express");
const http = require("http");
const https = require("https");
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
const imagesRouter = require('./routers/images.js');

// Setup environment
dotenv.config();
const isDev = process.env.NODE_ENV === 'development';
const errorHandler = require("./middleware/errorHandler.js");

// Start app
const app = express();
const cors = require("cors");
const bodyParser = require('body-parser');

const configureServer = (httpServer, isDev) => {
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

const io = configureServer(server);
console.log(`Server configured with cors.origin: ${io.opts.cors.origin} and secure: ${io.opts.secure}`);

setupWebsocket(io);
console.log(`Websocket setup with on() listeners.`);

// const io = socketIo(server, {
//   cors: {
//     origin: '*', //process.env.FRONTEND_URL, // will be set in .env or Dockerfile
//     methods: ['GET', 'POST'],
//   },
// });


app.use(cors());
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Create routes
app.use('/api/user', userRouter);
app.use('/api/folder', folderRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/image', imagesRouter);

app.use(errorHandler);

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

  // if (isDev) {
  //   // HTTP for development
  //   http.createServer(app).listen(port, () => {
  //     console.log(`Serveur en développement écoutant sur le port ${port} (HTTP)`);
  //   });
  // } else {
  //   // HTTPS for production
  //   const sslOptions = {
  //     key: fs.readFileSync(path.resolve(__dirname, "path_to_ssl_key.pem")),
  //     cert: fs.readFileSync(path.resolve(__dirname, "path_to_ssl_cert.pem")),
  //   };
  //   https.createServer(sslOptions, app).listen(443, () => {
  //     console.log(`Serveur en production écoutant sur le port 443 (HTTPS)`);
  //   });
  // }
}

start();

