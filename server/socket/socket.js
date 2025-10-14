const MAX_USERS_PER_ROOM = 60;
const MAX_TOTAL_CONNECTIONS = 2000;

const setupWebsocket = (io) => {
  let totalConnections = 0;

  io.on("connection", (socket) => {
    if (totalConnections >= MAX_TOTAL_CONNECTIONS) {
      console.log("socket.js: Connection limit reached. Disconnecting client.");
      socket.emit(
        "join-failure",
        "Le nombre maximum de connexions a été atteint"
      );
      socket.disconnect(true);
      return;
    }

    totalConnections++;
    console.log(
      "socket.js: A user connected:",
      socket.id,
      "| Total connections:",
      totalConnections
    );

    socket.on("create-room", (sentRoomName) => {
      console.log(`socket.js: Demande de création de salle avec le nom : ${sentRoomName}`);

      if (sentRoomName) {
        const roomName = sentRoomName.toUpperCase();
        if (!io.sockets.adapter.rooms.get(roomName)) {
          socket.join(roomName);
          socket.emit("create-success", roomName);
          console.log(`socket.js: Salle créée avec succès : ${roomName}`);
        } else {
          socket.emit("create-failure", `La salle ${roomName} existe déjà.`);
          console.log(`socket.js: Échec de création : ${roomName} existe déjà`);
        }
      }
      reportSalles();
    });
    
    function reportSalles() {
      console.log("socket.js: Salles existantes :", Array.from(io.sockets.adapter.rooms.keys()));
    }

    socket.on("join-room", ({ enteredRoomName, username }) => {
      const roomToCheck = enteredRoomName.toUpperCase();
      console.log(
        `socket.js: Requête de connexion : salle="${roomToCheck}", utilisateur="${username}"`
      );
      reportSalles();

      if (io.sockets.adapter.rooms.has(roomToCheck)) {
        console.log("socket.js: La salle existe");
        const clientsInRoom = io.sockets.adapter.rooms.get(roomToCheck).size;

        if (clientsInRoom <= MAX_USERS_PER_ROOM) {
          console.log("socket.js: La salle n'est pas pleine avec ", clientsInRoom, " utilisateurs");
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
          console.log("socket.js: La salle est pleine avec ", clientsInRoom, " utilisateurs");
          socket.emit("join-failure", "La salle est remplie");
        }
      } else {
        console.log("socket.js: La salle n'existe pas");
        socket.emit("join-failure", "Le nom de la salle n'existe pas");
      }
    });

    socket.on("next-question", ({ roomName, question }) => {
      console.log("socket.js: next-question", roomName, question);
      console.log("socket.js: rediffusion de la question", question);
      socket.to(roomName).emit("next-question", question);
    });

    socket.on("launch-teacher-mode", ({ roomName, questions, quizTitle }) => {
      socket.to(roomName).emit("launch-teacher-mode", { questions, quizTitle });
    });

    socket.on("launch-student-mode", ({ roomName, questions, quizTitle }) => {
      socket.to(roomName).emit("launch-student-mode", { questions, quizTitle });
    });

    socket.on("end-quiz", ({ roomName }) => {
      console.log("socket.js: end-quiz", roomName);
      socket.to(roomName).emit("end-quiz");
      io.sockets.adapter.rooms.delete(roomName);
      reportSalles();
    });

    socket.on("message", (data) => {
      console.log("socket.js: Received message from", socket.id, ":", data);
    });

    socket.on("disconnect", () => {
      totalConnections--;
      console.log(
        "socket.js: A user disconnected:",
        socket.id,
        "| Total connections:",
        totalConnections
      );
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
