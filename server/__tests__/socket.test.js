const http = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { setupWebsocket } = require("../socket/socket");
const jwt = require('../middleware/jwtToken.js');

process.env.NODE_ENV = "test";
// Set JWT secret for tests
process.env.JWT_SECRET = "test-jwt-secret-key";

const BACKEND_PORT = Math.ceil(Math.random() * 1000 + 3000);
const BACKEND_URL = "http://localhost";

const BACKEND_API = `${BACKEND_URL}:${BACKEND_PORT}`;

describe("websocket server", () => {
  let ioServer, server, teacherSocket, studentSocket, teacherToken;

  beforeAll((done) => {
    // Create a mock teacher JWT token
    teacherToken = jwt.create('teacher@test.com', 'teacher123', ['teacher']);
    
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
    server = httpServer.listen(BACKEND_PORT, () => {
      // Create socket connections for all tests
      // Teacher socket with JWT token
      teacherSocket = new Client(BACKEND_API, {
        path: "/socket.io",
        transports: ["websocket"],
        query: {
          token: teacherToken  // Pass teacher JWT token
        }
      });
      
      // Student socket without token (unauthenticated)
      studentSocket = new Client(BACKEND_API, {
        path: "/socket.io",
        transports: ["websocket"],
      });

      // Wait for both connections
      let connectedCount = 0;
      const onConnect = () => {
        connectedCount++;
        if (connectedCount === 2) {
          done();
        }
      };

      teacherSocket.on("connect", onConnect);
      studentSocket.on("connect", onConnect);
    });
  });

  // Clear event listeners before each test to prevent interference
  beforeEach((done) => {
    teacherSocket.removeAllListeners();
    studentSocket.removeAllListeners();
    // Add a small delay to ensure listeners are fully cleared
    setTimeout(() => {
      done();
    }, 50);
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

  test("should create a room", (done) => {
    teacherSocket.on("create-success", (roomName) => {
      expect(roomName).toBe("TESTROOM1");
      done();
    });
    teacherSocket.emit("create-room", "testroom1");
  });

  test("should not create a room if it already exists", (done) => {
    teacherSocket.on("create-failure", (message) => {
      expect(message).toContain("existe déjà");
      done();
    });
    teacherSocket.emit("create-room", "testroom1"); // Same room as previous test
  });

  test("should join a room", (done) => {
    // First create a room
    teacherSocket.emit("create-room", "testroom2");
    
    teacherSocket.on("create-success", () => {
      // Now join the room
      studentSocket.on("join-success", (roomName) => {
        expect(roomName).toBe("TESTROOM2");
        done();
      });
      studentSocket.emit("join-room", {
        enteredRoomName: "testroom2",
        username: "student1",
      });
    });
  });

  test("should not join a room if it does not exist", (done) => {
    studentSocket.on("join-failure", () => {
      done();
    });
    studentSocket.emit("join-room", {
      enteredRoomName: "NONEXISTENTROOM",
      username: "student1",
    });
  });

  test("should launch student mode", (done) => {
    // First create a room
    teacherSocket.emit("create-room", "testroom5");
    
    teacherSocket.on("create-success", () => {
      // Join the room as student
      studentSocket.emit("join-room", {
        enteredRoomName: "testroom5",
        username: "student1",
      });
      
      studentSocket.on("join-success", () => {
        // Now test launch student mode
        studentSocket.on("launch-student-mode", (questions) => {
          expect(questions).toEqual([
            { question: "question1" },
            { question: "question2" },
          ]);
          done();
        });
        teacherSocket.emit("launch-student-mode", {
          roomName: "TESTROOM5",
          questions: [{ question: "question1" }, { question: "question2" }],
        });
      });
    });
  });

  test("should launch teacher mode", (done) => {
    // First create a room
    teacherSocket.emit("create-room", "testroom6");
    
    teacherSocket.on("create-success", () => {
      // Join the room as student
      studentSocket.emit("join-room", {
        enteredRoomName: "testroom6",
        username: "student1",
      });
      
      studentSocket.on("join-success", () => {
        // Now test launch teacher mode
        studentSocket.on("launch-teacher-mode", (questions) => {
          expect(questions).toEqual([
            { question: "question1" },
            { question: "question2" },
          ]);
          done();
        });
        teacherSocket.emit("launch-teacher-mode", {
          roomName: "TESTROOM6",
          questions: [{ question: "question1" }, { question: "question2" }],
        });
      });
    });
  });

  test("should send next question", (done) => {
    // First create a room
    teacherSocket.emit("create-room", "testroom7");
    
    teacherSocket.on("create-success", () => {
      // Join the room as student
      studentSocket.emit("join-room", {
        enteredRoomName: "testroom7",
        username: "student1",
      });
      
      studentSocket.on("join-success", () => {
        // Now test next question
        studentSocket.on("next-question", ( question ) => {
          expect(question).toBe("question2");
          done();
        });
        teacherSocket.emit("next-question", { roomName: "TESTROOM7", question: 'question2'});
      });
    });
  });

  test("should send answer", (done) => {
    // First create a room
    teacherSocket.emit("create-room", "testroom8");
    
    teacherSocket.on("create-success", () => {
      // Join the room as student
      studentSocket.emit("join-room", {
        enteredRoomName: "testroom8",
        username: "student1",
      });
      
      studentSocket.on("join-success", () => {
        // Now test submit answer
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
          roomName: "TESTROOM8",
          username: "student1",
          answer: "answer1",
          idQuestion: 1,
        });
      });
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
    studentSocket.emit("join-room", { enteredRoomName: "TESTROOM2", username: "" });
  });

  test("should end quiz", (done) => {
    // First create a room
    teacherSocket.emit("create-room", "testroom9");
    
    teacherSocket.on("create-success", () => {
      // Join the room as student
      studentSocket.emit("join-room", {
        enteredRoomName: "testroom9",
        username: "student1",
      });
      
      studentSocket.on("join-success", () => {
        // Now test end quiz
        studentSocket.on("end-quiz", () => {
          done();
        });
        teacherSocket.emit("end-quiz", {
          roomName: "TESTROOM9",
        });
      });
    });
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
      }
    ];

    // Set up the event listener first
    studentSocket.on("launch-teacher-mode", (receivedQuestions) => {
      try {
        expect(receivedQuestions).toBeDefined();
        expect(Array.isArray(receivedQuestions)).toBe(true);
        
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
      } catch (error) {
        done(error);
      }
    });

    // Now start the sequence
    teacherSocket.emit("create-room", "security1");
    
    teacherSocket.on("create-success", () => {
      studentSocket.emit("join-room", {
        enteredRoomName: "security1",
        username: "student1",
      });
      
      studentSocket.on("join-success", () => {
        // Now emit the event
        teacherSocket.emit("launch-teacher-mode", {
          roomName: "SECURITY1",
          questions: questionsWithAnswers,
        });
      });
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

    // Set up the event listener first
    studentSocket.on("launch-student-mode", (receivedQuestions) => {
      try {
        expect(receivedQuestions).toBeDefined();
        expect(Array.isArray(receivedQuestions)).toBe(true);
        
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
      } catch (error) {
        done(error);
      }
    });

    // Now start the sequence
    teacherSocket.emit("create-room", "security2");
    
    teacherSocket.on("create-success", () => {
      studentSocket.emit("join-room", {
        enteredRoomName: "security2",
        username: "student1",
      });
      
      studentSocket.on("join-success", () => {
        // Now emit the event
        teacherSocket.emit("launch-student-mode", {
          roomName: "SECURITY2",
          questions: questionsWithAnswers,
        });
      });
    });
  });

  test("SECURITY: should NOT send correct answers to students in next-question", (done) => {
    const questionWithSensitiveData = {
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

    // Set up the event listener first
    studentSocket.on("next-question", (receivedQuestion) => {
      try {
        expect(receivedQuestion).toBeDefined();
        expect(receivedQuestion.correctAnswer).toBeUndefined();
        expect(receivedQuestion.explanation).toBeUndefined();
        expect(receivedQuestion.hints).toBeUndefined();
        
        if (receivedQuestion.options) {
          receivedQuestion.options.forEach((option) => {
            expect(option.isCorrect).toBeUndefined();
          });
        }
        done();
      } catch (error) {
        done(error);
      }
    });

    // Now start the sequence
    teacherSocket.emit("create-room", "security3");
    
    teacherSocket.on("create-success", () => {
      studentSocket.emit("join-room", {
        enteredRoomName: "security3",
        username: "student1",
      });
      
      studentSocket.on("join-success", () => {
        // Now emit the event
        teacherSocket.emit("next-question", {
          roomName: "SECURITY3",
          question: questionWithSensitiveData,
        });
      });
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

    // Set up the event listener first
    studentSocket.on("next-question", (receivedQuestion) => {
      try {
        expect(receivedQuestion.id).toBeDefined();
        expect(receivedQuestion.text).toBeDefined();
        expect(receivedQuestion.options).toBeDefined();
        expect(receivedQuestion.options).toHaveLength(3);
        
        receivedQuestion.options.forEach((option) => {
          expect(option.id).toBeDefined();
          expect(option.text).toBeDefined();
          expect(option.isCorrect).toBeUndefined();
        });

        expect(receivedQuestion.correctAnswer).toBeUndefined();
        expect(receivedQuestion.explanation).toBeUndefined();
        expect(receivedQuestion.hints).toBeUndefined();
        expect(receivedQuestion.metadata).toBeUndefined();
        expect(receivedQuestion.grading).toBeUndefined();
        
        done();
      } catch (error) {
        done(error);
      }
    });

    // Now start the sequence
    teacherSocket.emit("create-room", "security4");
    
    teacherSocket.on("create-success", () => {
      studentSocket.emit("join-room", {
        enteredRoomName: "security4",
        username: "student1",
      });
      
      studentSocket.on("join-success", () => {
        // Now emit the event
        teacherSocket.emit("next-question", {
          roomName: "SECURITY4",
          question: questionWithSensitiveData,
        });
      });
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

    // Set up the event listener first
    studentSocket.on("next-question", (receivedQuestion) => {
      try {
        const studentDataSize = JSON.stringify(receivedQuestion).length;
        const fullDataSize = JSON.stringify(fullQuestionData).length;
        
        console.log(`Student received data size: ${studentDataSize} bytes`);
        console.log(`Full data size: ${fullDataSize} bytes`);
        console.log(`Data reduction: ${((fullDataSize - studentDataSize) / fullDataSize * 100).toFixed(2)}%`);
        
        expect(studentDataSize).toBeLessThan(fullDataSize * 0.6);
        
        done();
      } catch (error) {
        done(error);
      }
    });

    // Now start the sequence
    teacherSocket.emit("create-room", "security5");
    
    teacherSocket.on("create-success", () => {
      studentSocket.emit("join-room", {
        enteredRoomName: "security5",
        username: "student1",
      });
      
      studentSocket.on("join-success", () => {
        // Now emit the event
        teacherSocket.emit("next-question", {
          roomName: "SECURITY5",
          question: fullQuestionData,
        });
      });
    });
  });

  test("SECURITY: should NOT send GIFT format sensitive data to students", (done) => {
    const giftFormatQuestion = {
      question: {
        type: "MC",
        title: "Villes canadiennes",
        stem: {
          format: "moodle",
          text: "Quelles villes trouve-t-on au Canada?"
        },
        choices: [
          {
            isCorrect: false,
            weight: 33.3,
            formattedText: {
              format: "moodle",
              text: "Montréal"
            }
          },
          {
            isCorrect: true,
            weight: 100,
            formattedText: {
              format: "moodle",
              text: "Ottawa"
            }
          },
          {
            isCorrect: false,
            weight: 33.3,
            formattedText: {
              format: "moodle",
              text: "Vancouver"
            }
          }
        ]
      }
    };

    // Set up the event listener first
    studentSocket.on("next-question", (receivedQuestion) => {
      try {
        expect(receivedQuestion).toBeDefined();
        
        // Check that the question structure is preserved
        expect(receivedQuestion.question).toBeDefined();
        expect(receivedQuestion.question.type).toBe("MC");
        expect(receivedQuestion.question.title).toBe("Villes canadiennes");
        
        // Check that sensitive data is removed from choices
        if (receivedQuestion.question.choices) {
          receivedQuestion.question.choices.forEach((choice) => {
            expect(choice.isCorrect).toBeUndefined();
            expect(choice.weight).toBeUndefined();
            expect(choice.formattedText).toBeDefined(); // Should keep the text
          });
        }
        
        done();
      } catch (error) {
        done(error);
      }
    });

    // Now start the sequence
    teacherSocket.emit("create-room", "security6");
    
    teacherSocket.on("create-success", () => {
      studentSocket.emit("join-room", {
        enteredRoomName: "security6",
        username: "student1",
      });
      
      studentSocket.on("join-success", () => {
        // Now emit the event
        teacherSocket.emit("next-question", {
          roomName: "SECURITY6",
          question: giftFormatQuestion,
        });
      });
    });
  });

  test("SECURITY: should NOT send numerical question answers to students", (done) => {
    const numericalQuestion = {
      question: {
        type: "Numerical",
        title: "Question numérique avec plusieurs réponses",
        formattedStem: {
          format: "moodle",
          text: "Quand est né Ulysses S. Grant ?"
        },
        hasEmbeddedAnswers: false,
        choices: [
          {
            isCorrect: true,
            answer: {
              type: "range",
              number: 1822,
              range: 0
            },
            formattedFeedback: {
              format: "moodle",
              text: "Correct ! Crédit complet."
            }
          },
          {
            isCorrect: true,
            weight: 50,
            answer: {
              type: "range",
              number: 1822,
              range: 2
            },
            formattedFeedback: {
              format: "moodle",
              text: "Il est né en 1822. Demi-crédit pour être proche."
            }
          }
        ],
        id: "6"
      }
    };

    // Set up the event listener first
    studentSocket.on("next-question", (receivedQuestion) => {
      try {
        expect(receivedQuestion).toBeDefined();
        
        // Check that the question structure is preserved
        expect(receivedQuestion.question).toBeDefined();
        expect(receivedQuestion.question.type).toBe("Numerical");
        expect(receivedQuestion.question.title).toBe("Question numérique avec plusieurs réponses");
        
        // Check that sensitive data is removed from choices
        if (receivedQuestion.question.choices) {
          receivedQuestion.question.choices.forEach((choice) => {
            expect(choice.isCorrect).toBeUndefined();
            expect(choice.weight).toBeUndefined();
            expect(choice.formattedFeedback).toBeUndefined();
            
            // Check that answer values are removed but type is preserved
            if (choice.answer) {
              expect(choice.answer.type).toBeDefined();
              expect(choice.answer.number).toBeUndefined();
              expect(choice.answer.range).toBeUndefined();
            }
          });
        }
        
        done();
      } catch (error) {
        done(error);
      }
    });

    // Now start the sequence
    teacherSocket.emit("create-room", "security7");
    
    teacherSocket.on("create-success", () => {
      studentSocket.emit("join-room", {
        enteredRoomName: "security7",
        username: "student1",
      });
      
      studentSocket.on("join-success", () => {
        // Now emit the event
        teacherSocket.emit("next-question", {
          roomName: "SECURITY7",
          question: numericalQuestion,
        });
      });
    });
  });

  test("should disconnect", (done) => {
    teacherSocket.disconnect();
    studentSocket.disconnect();
    done();
  });
});

