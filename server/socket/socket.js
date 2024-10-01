const MAX_USERS_PER_ROOM = 60;
const MAX_TOTAL_CONNECTIONS = 2000;
var passport = require('passport')
const Permissions = require("../models/permissions");
const AppError = require("../middleware/AppError");
const {UNAUTHORIZED_PERMISSION_MISSING} = require("../constants/errorCodes");

const setupWebsocket = (io) => {
  let totalConnections = 0;

  function onlyForHandshake(middleware) {
    return (req, res, next) => {
      const isHandshake = req._query.sid === undefined;
      if (isHandshake) {
        middleware(req, res, next);
      } else {
        next();
      }
    };
  }

  io.engine.use(onlyForHandshake(passport.session()));
  io.engine.use(
      onlyForHandshake((req, res, next) => {
        if (req.user) {
          next();
        } else {
          res.writeHead(401);
          res.end();
        }
      }),
  );

  io.on("connection", (socket) => {
    const userRole = socket.request.user.role;
    if (totalConnections >= MAX_TOTAL_CONNECTIONS) {
      console.log("Connection limit reached. Disconnecting client.");
      socket.emit(
        "join-failure",
        "Le nombre maximum de connexion a été atteint"
      );
      socket.disconnect(true);
      return;
    }

    totalConnections++;
    console.log(
      "A user connected:",
      socket.id,
      "| Total connections:",
      totalConnections
    );

    socket.on("create-room", (sentRoomName) => {
      const userPermissions = Permissions.getPermissionsByRoleName(userRole);
      if (!userPermissions.includes("create_quiz")) {
        socket.emit(UNAUTHORIZED_PERMISSION_MISSING.code, UNAUTHORIZED_PERMISSION_MISSING.message);
      }
      if (sentRoomName) {
        const roomName = sentRoomName.toUpperCase();
        if (!io.sockets.adapter.rooms.get(roomName)) {
          socket.join(roomName);
          socket.emit("create-success", roomName);
        } else {
          socket.emit("create-failure");
        }
      } else {
        const roomName = generateRoomName();
        if (!io.sockets.adapter.rooms.get(roomName)) {
          socket.join(roomName);
          socket.emit("create-success", roomName);
        } else {
          socket.emit("create-failure");
        }
      }
    });

    socket.on("join-room", ({ enteredRoomName, username }) => {
      const userPermissions = Permissions.getPermissionsByRoleName(userRole);
      if (!userPermissions.includes("participate_quiz")) {
        socket.emit(UNAUTHORIZED_PERMISSION_MISSING.code, UNAUTHORIZED_PERMISSION_MISSING.message);
      }
      if (io.sockets.adapter.rooms.has(enteredRoomName)) {
        const clientsInRoom =
          io.sockets.adapter.rooms.get(enteredRoomName).size;

        if (clientsInRoom <= MAX_USERS_PER_ROOM) {
          socket.join(enteredRoomName);
          socket
            .to(enteredRoomName)
            .emit("user-joined", { name: username, id: socket.id });
          socket.emit("join-success");
        } else {
          socket.emit("join-failure", "La salle est remplie");
        }
      } else {
        socket.emit("join-failure", "Le nom de la salle n'existe pas");
      }
    });

    socket.on("next-question", ({ roomName, question }) => {
      console.log("next-question", roomName, question);
      socket.to(roomName).emit("next-question", question);
    });

    socket.on("launch-student-mode", ({ roomName, questions }) => {
      socket.to(roomName).emit("launch-student-mode", questions);
    });

    socket.on("end-quiz", ({ roomName }) => {
      socket.to(roomName).emit("end-quiz");
    });

    socket.on("message", (data) => {
      console.log("Received message from", socket.id, ":", data);
    });

    socket.on("disconnect", () => {
      totalConnections--;
      console.log(
        "A user disconnected:",
        socket.id,
        "| Total connections:",
        totalConnections
      );

      for (const [room] of io.sockets.adapter.rooms) {
        if (room !== socket.id) {
          io.to(room).emit("user-disconnected", socket.id);
        }
      }
    });

    socket.on("submit-answer", ({ roomName, username, answer, idQuestion }) => {
      socket.to(roomName).emit("submit-answer", {
        idUser: socket.id,
        username,
        answer,
        idQuestion,
      });
    });
  });

  const generateRoomName = (length = 6) => {
    const characters = "0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };
};

module.exports = { setupWebsocket };
