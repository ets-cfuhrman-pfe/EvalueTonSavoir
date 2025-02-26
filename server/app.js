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
const questionnaires = require('./models/questionnaires.js');
const questionnaireModel = new questionnaires(db);
const folders = require('./models/folders.js');
const foldersModel = new folders(db, questionnaireModel);
const users = require('./models/users.js');
const userModel = new users(db, foldersModel);
const images = require('./models/images.js');
const imageModel = new images(db);
const students = require('./models/students.js');
const studentModel = new students();
const answers = require('./models/answers.js');
const answersModel = new answers();
const quizzes = require('./models/quizzes.js');
const quizzesModel = new quizzes();

// instantiate the controllers
const usersController = require('./controllers/users.js');
const usersControllerInstance = new usersController(userModel);
const foldersController = require('./controllers/folders.js');
const foldersControllerInstance = new foldersController(foldersModel);
const questionnaireController = require('./controllers/questionnaires.js');
const questionnaireControllerInstance = new questionnaireController(questionnaireModel, foldersModel);
const imagesController = require('./controllers/images.js');
const imagesControllerInstance = new imagesController(imageModel);
const studentsController = require('./controllers/students.js');
const studentsControllerInstance = new studentsController(studentModel);
const answersController = require('./controllers/answers.js');
const answersControllerInstance = new answersController(answersModel);
const quizzesController = require('./controllers/quizzes.js');
const quizzesControllerInstance = new quizzesController(quizzesModel);

// export the controllers
module.exports.users = usersControllerInstance;
module.exports.folders = foldersControllerInstance;
module.exports.questionnaires = questionnaireControllerInstance;
module.exports.images = imagesControllerInstance;
module.exports.students = studentsControllerInstance;
module.exports.answers = answersControllerInstance;
module.exports.quizzes = quizzesControllerInstance;

//import routers (instantiate controllers as side effect)
const userRouter = require('./routers/users.js');
const folderRouter = require('./routers/folders.js');
const questionnaireRouter = require('./routers/questionnaires.js');
const imagesRouter = require('./routers/images.js');
const studentsRouter = require('./routers/students.js');
const answersRouter = require('./routers/answers.js');
const quizzesRouter = require('./routers/quizzes.js');

// Setup environment
dotenv.config();
const isDev = process.env.NODE_ENV === 'development';
const errorHandler = require("./middleware/errorHandler.js");

// Start app
const app = express();
const cors = require("cors");
const bodyParser = require('body-parser');

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
app.use('/api/questionnaire', questionnaireRouter);
app.use('/api/image', imagesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/answers', answersRouter);
app.use('/api/quizzes', quizzesRouter);

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
}

start();
