const MAX_USERS_PER_ROOM = 60;
const MAX_TOTAL_CONNECTIONS = 2000;

const setupWebsocket = (io) => {
  let totalConnections = 0;

  io.on("connection", (socket) => {
    if (totalConnections >= MAX_TOTAL_CONNECTIONS) {
      console.log("Connection limit reached. Disconnecting client.");
      socket.emit(
        "join-failure",
        "Le nombre maximum de connexions a été atteint"
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
      console.log(`Demande de création de salle avec le nom : ${sentRoomName}`);

      if (sentRoomName) {
        const roomName = sentRoomName.toUpperCase();
        if (!io.sockets.adapter.rooms.get(roomName)) {
          socket.join(roomName);
          socket.emit("create-success", roomName);
          console.log(`Salle créée avec succès : ${roomName}`);
        } else {
          socket.emit("create-failure", `La salle ${roomName} existe déjà.`);
          console.log(`Échec de création : ${roomName} existe déjà`);
        }
      }
      console.log(
        "Salles existantes après la tentative de création : ",
        Array.from(io.sockets.adapter.rooms.keys())
      );
    });

    socket.on("join-room", ({ enteredRoomName, username }) => {
      const roomToCheck = enteredRoomName.toUpperCase();
      console.log(
        `Requête de connexion : salle="${roomToCheck}", utilisateur="${username}"`
      );
      console.log(
        "Salles existantes :",
        Array.from(io.sockets.adapter.rooms.keys())
      );

      if (io.sockets.adapter.rooms.has(roomToCheck)) {
        const clientsInRoom = io.sockets.adapter.rooms.get(roomToCheck).size;

        if (clientsInRoom <= MAX_USERS_PER_ROOM) {
          const newStudent = {
            id: socket.id,
            name: username,
            answers: [],
          };
          socket.join(roomToCheck);
          socket.to(roomToCheck).emit("user-joined", newStudent);
          socket.emit("join-success");
        } else {
          socket.emit("join-failure", "La salle est remplie");
        }
      } else {
        socket.emit("join-failure", "Le nom de la salle n'existe pas");
      }
    });

    socket.on("next-question", ({ roomName, question }) => {
      // console.log("next-question", roomName, question);
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
