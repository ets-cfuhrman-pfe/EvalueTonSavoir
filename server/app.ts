// Import API
const express = require("express");
const http = require("http");
const dotenv = require('dotenv')

// Import Sockets
const { setupWebsocket } = require("./socket/socket");
const { Server } = require("socket.io");

//import routers
const userRouter = require('./routers/users.js');
const folderRouter = require('./routers/folders.js');
const quizRouter = require('./routers/quiz.js');
const imagesRouter = require('./routers/images.js')

// Setup environement
dotenv.config();
const db = require('./config/db.js');
const errorHandler = require("./middleware/errorHandler.js");

// Start app
const app = express();
const cors = require("cors");
const bodyParser = require('body-parser');

const configureServer = (httpServer) => {
  return new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
};

// Start sockets
const server = http.createServer(app);
const io = configureServer(server);

setupWebsocket(io);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Create routes
app.use('/api/user', userRouter);
app.use('/api/folder', folderRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/image', imagesRouter);

app.use(errorHandler)

// Start server
async function start() {

  const port = process.env.PORT || 4400;

  // Check DB connection
  await db.connect()
  db.getConnection();
  console.log(`Connexion MongoDB établie`);

  server.listen(port, () => {
    console.log(`Serveur écoutant sur le port ${port}`);
  });

}

start();
