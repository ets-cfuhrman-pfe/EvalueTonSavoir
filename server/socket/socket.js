const MAX_USERS_PER_ROOM = 60;
const MAX_TOTAL_CONNECTIONS = 2000;
const { transformToStudentViews } = require('../services/QuestionTransformationService');
const { getUserRole, setUserRole } = require('../auth/roleManager');
const { validateAnswer } = require('../services/ValidationBridge');

const setupWebsocket = (io) => {
  let totalConnections = 0;
  
  // Store current questions by room for validation purposes
  const roomQuestions = new Map();

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

      // Store the full question for validation purposes
      const upperRoomName = roomName.toUpperCase();
      if (!roomQuestions.has(upperRoomName)) {
        roomQuestions.set(upperRoomName, new Map());
      }
      const roomQuestionMap = roomQuestions.get(upperRoomName);
      if (question.question?.id) {
        roomQuestionMap.set(question.question.id, question);
      }

      // Transform question to student-safe view (remove sensitive data)
      const studentQuestion = transformToStudentViews([question])[0];

      console.log("socket.js: broadcasting student-safe question to room:", roomName);
      socket.to(roomName).emit("next-question", studentQuestion);
    });

    socket.on("launch-teacher-mode", ({ roomName, questions }) => {
      console.log("socket.js: launch-teacher-mode for room:", roomName);

      // Only teachers should be able to launch teacher mode
      const currentRole = getUserRole(socket);
      if (currentRole !== 'teacher') {
        console.log(`socket.js: Unauthorized launch-teacher-mode attempt by ${socket.id} with role: ${currentRole}`);
        return;
      }

      // Transform questions to student-safe views (remove sensitive data)
      const studentQuestions = transformToStudentViews(questions);

      console.log("socket.js: broadcasting student-safe questions to students in room:", roomName);
      socket.to(roomName).emit("launch-teacher-mode", studentQuestions);
    });

    socket.on("launch-student-mode", ({ roomName, questions }) => {
      console.log("socket.js: launch-student-mode for room:", roomName);

      // Only teachers should be able to launch student mode
      const currentRole = getUserRole(socket);
      if (currentRole !== 'teacher') {
        console.log(`socket.js: Unauthorized launch-student-mode attempt by ${socket.id} with role: ${currentRole}`);
        return;
      }

      // Store all questions for validation purposes (BEFORE sanitization)
      const upperRoomName = roomName.toUpperCase();
      if (!roomQuestions.has(upperRoomName)) {
        roomQuestions.set(upperRoomName, new Map());
      }
      const roomQuestionMap = roomQuestions.get(upperRoomName);
      console.log(`socket.js: Storing ${questions.length} questions for room ${upperRoomName}`);
      questions.forEach(questionObj => {
        console.log(`socket.js: Processing question:`, questionObj.question?.id, questionObj.question?.stem);
        if (questionObj.question?.id) {
          // Store the ORIGINAL question object for validation (not sanitized)
          roomQuestionMap.set(questionObj.question.id, questionObj);
          console.log(`socket.js: Stored question ID ${questionObj.question.id} for validation`);
        }
      });
      console.log(`socket.js: Total questions stored for room ${upperRoomName}:`, roomQuestionMap.size);

      // Transform questions to student-safe views (remove sensitive data)
      const studentQuestions = transformToStudentViews(questions);

      console.log("socket.js: broadcasting student-safe questions to students in room:", roomName);
      socket.to(roomName).emit("launch-student-mode", studentQuestions);
    });

    socket.on("end-quiz", ({ roomName }) => {
      console.log("socket.js: end-quiz", roomName);
      
      // Only teachers should be able to end quizzes
      const currentRole = getUserRole(socket);
      if (currentRole !== 'teacher') {
        console.log(`socket.js: Unauthorized end-quiz attempt by ${socket.id} with role: ${currentRole}`);
        return;
      }

      const upperRoomName = roomName.toUpperCase();
      socket.to(upperRoomName).emit("end-quiz");
      io.sockets.adapter.rooms.delete(upperRoomName);
      
      // Clean up room questions
      roomQuestions.delete(upperRoomName);
      
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
      // Send answer to teacher
      socket.to(roomName).emit("submit-answer-room", {
        idUser: socket.id,
        username,
        answer,
        idQuestion,
      });

      // Validate answer for student feedback
      const upperRoomName = roomName.toUpperCase();
      const roomQuestionMap = roomQuestions.get(upperRoomName);
      
      console.log(`socket.js: Looking for question ID ${idQuestion} (type: ${typeof idQuestion}) in room ${upperRoomName}`);
      console.log(`socket.js: Room question map exists:`, !!roomQuestionMap);
      console.log(`socket.js: Available question IDs:`, roomQuestionMap ? Array.from(roomQuestionMap.keys()).map(id => `${id} (${typeof id})`) : 'none');
      
      // Try both the original ID and string/number conversion
      let actualQuestionId = null;
      let questionFound = false;
      
      if (roomQuestionMap?.has(idQuestion)) {
        actualQuestionId = idQuestion;
        questionFound = true;
      } else if (roomQuestionMap?.has(String(idQuestion))) {
        actualQuestionId = String(idQuestion);
        questionFound = true;
      } else if (roomQuestionMap?.has(Number(idQuestion))) {
        actualQuestionId = Number(idQuestion);
        questionFound = true;
      }
      
      if (questionFound && actualQuestionId !== null) {
        const questionObj = roomQuestionMap.get(actualQuestionId);
        const questionData = questionObj.question;
        console.log(`socket.js: Question data for validation:`, JSON.stringify(questionData, null, 2));
        console.log(`socket.js: Student answer:`, answer);
        const validation = validateAnswer(questionData, answer);
        console.log(`socket.js: Validation result:`, validation);
        
        // Send validation result back to the student
        socket.emit("answer-validation", {
          idQuestion,
          isCorrect: validation.isCorrect,
          feedback: validation.feedback
        });

        console.log(`socket.js: Answer validation for student ${username}: ${validation.isCorrect ? 'correct' : 'incorrect'}`);
      } else {
        console.log(`socket.js: No question found for validation in room ${upperRoomName}, question ID ${idQuestion}`);
      }
    });
  });
};

module.exports = { setupWebsocket };
