const MAX_USERS_PER_ROOM = 60;
const MAX_TOTAL_CONNECTIONS = 2000;
const { sanitizeQuestions, getUserRole, setUserRole } = require('../utils/dataSanitizer');

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

    // Set user role for security and data sanitization
    const userRole = getUserRole(socket);
    setUserRole(socket, userRole);
    console.log(`socket.js: User ${socket.id} assigned role: ${userRole}`);

    socket.on("create-room", (sentRoomName) => {
      console.log(`socket.js: Demande de création de salle avec le nom : ${sentRoomName}`);

      // Room creation should only be allowed for authenticated teachers
      const currentRole = getUserRole(socket);
      if (currentRole !== 'teacher') {
        console.log(`socket.js: Unauthorized room creation attempt by ${socket.id} with role: ${currentRole}`);
        socket.emit("create-failure", "Seuls les enseignants peuvent créer des salles.");
        return;
      }

      if (sentRoomName) {
        const roomName = sentRoomName.toUpperCase();
        if (!io.sockets.adapter.rooms.get(roomName)) {
          socket.join(roomName);
          socket.emit("create-success", roomName);
          console.log(`socket.js: Salle créée avec succès : ${roomName} par l'enseignant ${socket.id}`);
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
      const roomToCheck = enteredRoomName ? enteredRoomName.toUpperCase() : "";
      console.log(
        `socket.js: Requête de connexion : salle="${roomToCheck}", utilisateur="${username}"`
      );
      
      // Validate room name
      if (!enteredRoomName || enteredRoomName.trim() === "") {
        console.log("socket.js: Room name validation failed - empty room name");
        socket.emit("join-failure", "Le nom de la salle est requis");
        return;
      }
      
      // Validate username
      if (!username || username.trim() === "") {
        console.log("socket.js: Username validation failed - empty username");
        socket.emit("join-failure", "Le nom d'utilisateur est requis");
        return;
      }
      
      // When joining a room, user is treated as a student (no authentication required)
      // Override role to 'student' for join-room action regardless of token
      setUserRole(socket, 'student');
      console.log(`socket.js: User ${socket.id} joining room as student`);
      
      reportSalles();

      if (io.sockets.adapter.rooms.has(roomToCheck)) {
        console.log("socket.js: La salle existe");
        const clientsInRoom = io.sockets.adapter.rooms.get(roomToCheck).size;

        if (clientsInRoom <= MAX_USERS_PER_ROOM) {
          console.log("socket.js: La salle n'est pas pleine avec ", clientsInRoom, " utilisateurs");
          const newStudent = {
            id: socket.id,
            name: username,
            answers: [],
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
      console.log("socket.js: next-question request for room:", roomName);

      // Only teachers should be able to control quiz progression
      const currentRole = getUserRole(socket);
      if (currentRole !== 'teacher') {
        console.log(`socket.js: Unauthorized next-question attempt by ${socket.id} with role: ${currentRole}`);
        return;
      }

      // Sanitize question data for students (recipients) - remove sensitive data
      const sanitizedQuestion = sanitizeQuestions(question, 'student');

      console.log("socket.js: broadcasting sanitized question to room:", roomName);
      socket.to(roomName).emit("next-question", sanitizedQuestion);
    });

    socket.on("launch-teacher-mode", ({ roomName, questions }) => {
      console.log("socket.js: launch-teacher-mode for room:", roomName);

      // Only teachers should be able to launch teacher mode
      const currentRole = getUserRole(socket);
      if (currentRole !== 'teacher') {
        console.log(`socket.js: Unauthorized launch-teacher-mode attempt by ${socket.id} with role: ${currentRole}`);
        return;
      }

      // Sanitize questions for students (recipients) - remove sensitive data
      const sanitizedQuestions = sanitizeQuestions(questions, 'student');

      console.log("socket.js: broadcasting sanitized questions to students in room:", roomName);
      socket.to(roomName).emit("launch-teacher-mode", sanitizedQuestions);
    });

    socket.on("launch-student-mode", ({ roomName, questions }) => {
      console.log("socket.js: launch-student-mode for room:", roomName);

      // Only teachers should be able to launch student mode
      const currentRole = getUserRole(socket);
      if (currentRole !== 'teacher') {
        console.log(`socket.js: Unauthorized launch-student-mode attempt by ${socket.id} with role: ${currentRole}`);
        return;
      }

      // Sanitize questions for students (recipients) - remove sensitive data
      const sanitizedQuestions = sanitizeQuestions(questions, 'student');

      console.log("socket.js: broadcasting sanitized questions to students in room:", roomName);
      socket.to(roomName).emit("launch-student-mode", sanitizedQuestions);
    });

    socket.on("end-quiz", ({ roomName }) => {
      console.log("socket.js: end-quiz", roomName);
      
      // Only teachers should be able to end quizzes
      const currentRole = getUserRole(socket);
      if (currentRole !== 'teacher') {
        console.log(`socket.js: Unauthorized end-quiz attempt by ${socket.id} with role: ${currentRole}`);
        return;
      }

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
