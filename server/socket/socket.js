const logger = require('../config/logger');

const MAX_USERS_PER_ROOM = 60;
const MAX_TOTAL_CONNECTIONS = 2000;

const setupWebsocket = (io) => {
  let totalConnections = 0;

  io.on("connection", (socket) => {
    if (totalConnections >= MAX_TOTAL_CONNECTIONS) {
      logger.warn("Connection limit reached. Disconnecting client", {
        socketId: socket.id,
        totalConnections,
        maxConnections: MAX_TOTAL_CONNECTIONS
      });
      socket.emit(
        "join-failure",
        "Le nombre maximum de connexions a été atteint"
      );
      socket.disconnect(true);
      return;
    }

    totalConnections++;
    logger.info("User connected", {
      socketId: socket.id,
      totalConnections
    });

    socket.on("create-room", (sentRoomName) => {
      logger.logSocketEvent("create-room", socket.id, null, { roomName: sentRoomName });

      if (sentRoomName) {
        const roomName = sentRoomName.toUpperCase();
        if (!io.sockets.adapter.rooms.get(roomName)) {
          socket.join(roomName);
          socket.emit("create-success", roomName);
          logger.info("Room created successfully", { roomName, socketId: socket.id });
        } else {
          socket.emit("create-failure", `La salle ${roomName} existe déjà.`);
          logger.warn("Room creation failed: room already exists", { roomName, socketId: socket.id });
        }
      }
      reportSalles();
    });
    
    function reportSalles() {
      logger.debug("Existing rooms", { rooms: Array.from(io.sockets.adapter.rooms.keys()) });
    }

    socket.on("join-room", ({ enteredRoomName, username }) => {
      const roomToCheck = enteredRoomName.toUpperCase();
      logger.info("Join room request", { roomName: roomToCheck, username, socketId: socket.id });
      reportSalles();

      if (io.sockets.adapter.rooms.has(roomToCheck)) {
        logger.debug("Room exists", { roomName: roomToCheck });
        const clientsInRoom = io.sockets.adapter.rooms.get(roomToCheck).size;

        if (clientsInRoom <= MAX_USERS_PER_ROOM) {
          logger.debug("Room not full", { roomName: roomToCheck, clientsInRoom, maxUsers: MAX_USERS_PER_ROOM });
          const newStudent = {
            id: socket.id,
            name: username,
            room: roomToCheck,
            answers: [],
            isConnected: true,
          };
          socket.join(roomToCheck);
          socket.to(roomToCheck).emit("user-joined", newStudent);
          socket.emit("join-success", roomToCheck);
        } else {
          logger.warn("Room full", { roomName: roomToCheck, clientsInRoom, maxUsers: MAX_USERS_PER_ROOM });
          socket.emit("join-failure", "La salle est remplie");
        }
      } else {
        logger.warn("Room does not exist", { roomName: roomToCheck });
        socket.emit("join-failure", "Le nom de la salle n'existe pas");
      }
    });

    socket.on("next-question", ({ roomName, question }) => {
      logger.info("Next question", { roomName, questionId: question?.id, socketId: socket.id });
      logger.debug("Broadcasting question", { question });
      socket.to(roomName).emit("next-question", question);
    });

    socket.on("launch-teacher-mode", ({ roomName, questions, quizTitle }) => {
      socket.to(roomName).emit("launch-teacher-mode", { questions, quizTitle });
    });

    socket.on("launch-student-mode", ({ roomName, questions, quizTitle }) => {
      socket.to(roomName).emit("launch-student-mode", { questions, quizTitle });
    });

    socket.on("end-quiz", ({ roomName }) => {
      logger.info("Quiz ended", { roomName, socketId: socket.id });
      socket.to(roomName).emit("end-quiz");
      io.sockets.adapter.rooms.delete(roomName);
      reportSalles();
    });

    socket.on("message", (data) => {
      logger.info("Message received", { socketId: socket.id, data });
    });

    socket.on("disconnect", () => {
      totalConnections--;
      logger.info("User disconnected", { socketId: socket.id, totalConnections });
      reportSalles();
 
      for (const [room] of io.sockets.adapter.rooms) {
        if (room !== socket.id) {
          io.to(room).emit("user-disconnected", socket.id);
        }
      }
    });

    socket.on("submit-answer", ({ roomName, username, answer, idQuestion }) => {
      socket.to(roomName).emit("submit-answer-room", {
        idUser: socket.id,
        username,
        answer,
        idQuestion,
      });
    });
  });
};

module.exports = { setupWebsocket };
