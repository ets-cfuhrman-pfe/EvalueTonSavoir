const http = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { setupWebsocket } = require("../socket/socket");

process.env.NODE_ENV = "test";

const BACKEND_PORT = Math.ceil(Math.random() * 1000 + 3000);
const BACKEND_URL = "http://localhost";

const BACKEND_API = `${BACKEND_URL}:${BACKEND_PORT}`;

describe("websocket server", () => {
  let ioServer, server, teacherSocket, studentSocket;

  beforeAll((done) => {
    const httpServer = http.createServer();
    ioServer = new Server(httpServer, {
      path: "/socket.io",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });
    setupWebsocket(ioServer);
    server = httpServer.listen(BACKEND_PORT, () => done());
  });

  afterAll(() => {
    ioServer.close();
    server.close();
    if (teacherSocket) {
      console.log("teacherSocket disconnect");
      teacherSocket.disconnect();
      if (studentSocket) {
        console.log("studentSocket disconnect");
        studentSocket.disconnect();
      }
    }
  });

  test("should connect to the server", (done) => {
    teacherSocket = new Client(BACKEND_API, {
      path: "/socket.io",
      transports: ["websocket"],
    });
    studentSocket = new Client(BACKEND_API, {
      path: "/socket.io",
      transports: ["websocket"],
    });
    studentSocket.on("connect", () => {
      expect(studentSocket.connected).toBe(true);
    });
    teacherSocket.on("connect", () => {
      expect(teacherSocket.connected).toBe(true);
      done();
    });
  });

  test("should create a room", (done) => {
    teacherSocket.on("create-success", (roomName) => {
      expect(roomName).toBe("ROOM1");
      done();
    });
    teacherSocket.emit("create-room", "room1");
  });

  test("should not create a room if it already exists", (done) => {
    teacherSocket.on("create-failure", () => {
      done();
    });
    teacherSocket.emit("create-room", "room1");
  });

  test("should join a room", (done) => {
    studentSocket.on("join-success", (roomName) => {
      expect(roomName).toBe("ROOM1");
      done();
    });
    studentSocket.emit("join-room", {
      enteredRoomName: "room1",
      username: "student1",
    });
  });

  test("should not join a room if it does not exist", (done) => {
    studentSocket.on("join-failure", () => {
      done();
    });
    studentSocket.emit("join-room", {
      enteredRoomName: "ROOM2",
      username: "student1",
    });
  });

  test("should launch student mode", (done) => {
    studentSocket.on("launch-student-mode", (questions) => {
      expect(questions).toEqual([
        { question: "question1" },
        { question: "question2" },
      ]);
      done();
    });
    teacherSocket.emit("launch-student-mode", {
      roomName: "ROOM1",
      questions: [{ question: "question1" }, { question: "question2" }],
    });
  });

  test("should launch teacher mode", (done) => {
    studentSocket.on("launch-teacher-mode", (questions) => {
      expect(questions).toEqual([
        { question: "question1" },
        { question: "question2" },
      ]);
      done();
    });
    teacherSocket.emit("launch-teacher-mode", {
      roomName: "ROOM1",
      questions: [{ question: "question1" }, { question: "question2" }],
    });
  });

  test("should send next question", (done) => {
    studentSocket.on("next-question", ( question ) => {
      expect(question).toBe("question2");
      done();
    });
    teacherSocket.emit("next-question", { roomName: "ROOM1", question: 'question2'},
    );
  });

  test("should send answer", (done) => {
    teacherSocket.on("submit-answer-room", (answer) => {
      expect(answer).toEqual({
        idUser: studentSocket.id,
        username: "student1",
        answer: "answer1",
        idQuestion: 1,
      });
      done();
    });
    studentSocket.emit("submit-answer", {
      roomName: "ROOM1",
      username: "student1",
      answer: "answer1",
      idQuestion: 1,
    });
  });

  test("should not join a room if no room name is provided", (done) => {
    studentSocket.on("join-failure", () => {
      done();
    });
    studentSocket.emit("join-room", {
      enteredRoomName: "",
      username: "student1",
    });
  });

  test("should not join a room if the username is not provided", (done) => {
    studentSocket.on("join-failure", () => {
      done();
    });
    studentSocket.emit("join-room", { enteredRoomName: "ROOM2", username: "" });
  });

  test("should end quiz", (done) => {
    studentSocket.on("end-quiz", () => {
      done();
    });
    teacherSocket.emit("end-quiz", {
      roomName: "ROOM1",
    });
  });

  test("should disconnect", (done) => {
    teacherSocket.disconnect();
    studentSocket.disconnect();
    done();
  });

  test("SECURITY: should NOT send correct answers to students in launch-teacher-mode", (done) => {
      const questionsWithAnswers = [
        {
          id: 1,
          question: "What is 2+2?",
          options: [
            { text: "3", isCorrect: false },
            { text: "4", isCorrect: true },
            { text: "5", isCorrect: false }
          ],
          correctAnswer: "4",
          explanation: "Basic addition: 2+2=4",
          hints: ["Think about counting"]
        },
        {
          id: 2,
          question: "What is the capital of France?",
          options: [
            { text: "London", isCorrect: false },
            { text: "Paris", isCorrect: true },
            { text: "Berlin", isCorrect: false }
          ],
          correctAnswer: "Paris",
          explanation: "Paris is the capital city of France",
          hints: ["It's known as the City of Light"]
        }
      ];

      studentSocket.on("launch-teacher-mode", (receivedQuestions) => {
        receivedQuestions.forEach((question) => {
          expect(question.correctAnswer).toBeUndefined();
          expect(question.explanation).toBeUndefined();
          expect(question.hints).toBeUndefined();
          
          // Options should not contain isCorrect flags for students
          if (question.options) {
            question.options.forEach((option) => {
              expect(option.isCorrect).toBeUndefined();
            });
          }
        });
        done();
      });

      teacherSocket.emit("launch-teacher-mode", {
        roomName: "ROOM1",
        questions: questionsWithAnswers,
      });
    });

    test("SECURITY: should NOT send correct answers to students in launch-student-mode", (done) => {
      const questionsWithAnswers = [
        {
          id: 1,
          question: "What is the color of the sky?",
          options: [
            { text: "Red", isCorrect: false },
            { text: "Blue", isCorrect: true },
            { text: "Green", isCorrect: false }
          ],
          correctAnswer: "Blue",
          explanation: "The sky appears blue due to light scattering",
          hints: ["Look outside during daytime"]
        }
      ];

      studentSocket.on("launch-student-mode", (receivedQuestions) => {
        receivedQuestions.forEach((question) => {
          expect(question.correctAnswer).toBeUndefined();
          expect(question.explanation).toBeUndefined();
          expect(question.hints).toBeUndefined();
          
          if (question.options) {
            question.options.forEach((option) => {
              expect(option.isCorrect).toBeUndefined();
            });
          }
        });
        done();
      });

      teacherSocket.emit("launch-student-mode", {
        roomName: "ROOM1",
        questions: questionsWithAnswers,
      });
    });

    test("SECURITY: should NOT send correct answers to students in next-question", (done) => {
      const questionWithAnswer = {
        id: 3,
        question: "What is 5*5?",
        options: [
          { text: "20", isCorrect: false },
          { text: "25", isCorrect: true },
          { text: "30", isCorrect: false }
        ],
        correctAnswer: "25",
        explanation: "5 multiplied by 5 equals 25",
        hints: ["Think about multiplication tables"]
      };

    studentSocket.on("next-question", (receivedQuestion) => {
      expect(receivedQuestion.correctAnswer).toBeUndefined();
      expect(receivedQuestion.explanation).toBeUndefined();
      expect(receivedQuestion.hints).toBeUndefined();        if (receivedQuestion.options) {
          receivedQuestion.options.forEach((option) => {
            expect(option.isCorrect).toBeUndefined();
          });
        }
        done();
      });

      teacherSocket.emit("next-question", {
        roomName: "ROOM1",
        question: questionWithAnswer,
      });
    });

    test("SECURITY: students should only receive necessary question data", (done) => {
      const questionWithSensitiveData = {
        id: 4,
        question: "What is the largest planet in our solar system?",
        options: [
          { id: "a", text: "Earth", isCorrect: false },
          { id: "b", text: "Jupiter", isCorrect: true },
          { id: "c", text: "Saturn", isCorrect: false }
        ],
        correctAnswer: "Jupiter",
        explanation: "Jupiter is the largest planet by mass and volume",
        hints: ["It's a gas giant"],
        metadata: { difficulty: "easy", category: "astronomy" },
        grading: { points: 10, timeLimit: 30 }
      };

    studentSocket.on("next-question", (receivedQuestion) => {
      expect(receivedQuestion.id).toBeDefined();
      expect(receivedQuestion.question).toBeDefined();
      expect(receivedQuestion.options).toBeDefined();
        expect(receivedQuestion.options).toHaveLength(3);
        receivedQuestion.options.forEach((option) => {
          expect(option.id).toBeDefined();
          expect(option.text).toBeDefined();
          expect(option.isCorrect).toBeUndefined(); // Should FAIL until fix
        });

        expect(receivedQuestion.correctAnswer).toBeUndefined(); 
        expect(receivedQuestion.explanation).toBeUndefined(); 
        expect(receivedQuestion.hints).toBeUndefined(); 
        expect(receivedQuestion.grading).toBeUndefined(); 
        
        done();
      });

      teacherSocket.emit("next-question", {
        roomName: "ROOM1",
        question: questionWithSensitiveData,
      });
    });

    test("SECURITY: should verify data size difference between teacher and student payloads", (done) => {
      const fullQuestionData = {
        id: 5,
        question: "Test question with lots of sensitive data",
        options: [
          { id: "a", text: "Option A", isCorrect: false, feedback: "Wrong answer" },
          { id: "b", text: "Option B", isCorrect: true, feedback: "Correct!" },
          { id: "c", text: "Option C", isCorrect: false, feedback: "Try again" }
        ],
        correctAnswer: "Option B",
        explanation: "This is a detailed explanation of why B is correct",
        hints: ["Hint 1", "Hint 2", "Hint 3"],
        metadata: { author: "teacher", created: "2024-01-01" },
        grading: { points: 15, partialCredit: true, rubric: "detailed rubric" }
      };

      let studentDataSize = 0;
      
    studentSocket.on("next-question", (receivedQuestion) => {
      studentDataSize = JSON.stringify(receivedQuestion).length;       
        const fullDataSize = JSON.stringify(fullQuestionData).length;
        
        console.log(`Student received data size: ${studentDataSize} bytes`);
        console.log(`Full data size: ${fullDataSize} bytes`);
        console.log(`Reduction ratio: ${((fullDataSize - studentDataSize) / fullDataSize * 100).toFixed(2)}%`);
        
        // This should FAIL until fix - students currently get full data
        expect(studentDataSize).toBeLessThan(fullDataSize * 0.6); 
        
        done();
      });

      teacherSocket.emit("next-question", {
        roomName: "ROOM1",
        question: fullQuestionData,
      });
    });
});

