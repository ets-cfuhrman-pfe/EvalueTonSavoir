const http = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { setupWebsocket } = require("../../socket/socket");

process.env.NODE_ENV = "test";

// pick a random port number for testing
const BACKEND_PORT = Math.ceil(Math.random() * 1000 + 3000);
const BACKEND_URL = "http://localhost";

const BACKEND_API = `${BACKEND_URL}:${BACKEND_PORT}`;

const ROOM_NAME = "room1";
const EXPECTED_ROOM_NAME = "ROOM1";
const NON_EXISTENT_ROOM = "ROOM2";
const STUDENT_USERNAME = "student1";
const QUIZ_TITLE = "Test Quiz";
const QUESTION_1 = "question1";
const QUESTION_2 = "question2";
const QUESTIONS = [{ question: QUESTION_1 }, { question: QUESTION_2 }];
const ANSWER_1 = "answer1";

const CREATE_SUCCESS_EVENT = "create-success";
const CREATE_FAILURE_EVENT = "create-failure";
const JOIN_SUCCESS_EVENT = "join-success";
const JOIN_FAILURE_EVENT = "join-failure";
const CREATE_ROOM_EVENT = "create-room";
const JOIN_ROOM_EVENT = "join-room";
const LAUNCH_STUDENT_MODE_EVENT = "launch-student-mode";
const LAUNCH_TEACHER_MODE_EVENT = "launch-teacher-mode";
const NEXT_QUESTION_EVENT = "next-question";
const SUBMIT_ANSWER_EVENT = "submit-answer";
const SUBMIT_ANSWER_ROOM_EVENT = "submit-answer-room";
const END_QUIZ_EVENT = "end-quiz";

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

  beforeEach(() => {
    // Clear all rooms before each test to ensure clean state
    const rooms = ioServer.sockets.adapter.rooms;
    for (const [roomName, room] of rooms) {
      if (!roomName.startsWith('/')) {
        // Disconnect all sockets in the room
        const sockets = room.sockets || room;
        if (typeof sockets === 'object') {
          for (const socketId of Object.keys(sockets)) {
            const socket = ioServer.sockets.sockets.get(socketId);
            if (socket) {
              socket.leave(roomName);
            }
          }
        }
      }
    }
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
    teacherSocket.on(CREATE_SUCCESS_EVENT, (roomName) => {
      expect(roomName).toBe(EXPECTED_ROOM_NAME);
      done();
    });
    teacherSocket.emit(CREATE_ROOM_EVENT, ROOM_NAME);
  });

  test("should not create a room if it already exists", (done) => {
    teacherSocket.on(CREATE_FAILURE_EVENT, () => {
      done();
    });
    teacherSocket.emit(CREATE_ROOM_EVENT, ROOM_NAME);
  });

  test("should join a room", (done) => {
    studentSocket.on(JOIN_SUCCESS_EVENT, (roomName) => {
      expect(roomName).toBe(EXPECTED_ROOM_NAME);
      done();
    });
    studentSocket.emit(JOIN_ROOM_EVENT, {
      enteredRoomName: ROOM_NAME,
      username: STUDENT_USERNAME,
    });
  });

  test("should not join a room if it does not exist", (done) => {
    studentSocket.on(JOIN_FAILURE_EVENT, () => {
      done();
    });
    studentSocket.emit(JOIN_ROOM_EVENT, {
      enteredRoomName: NON_EXISTENT_ROOM,
      username: STUDENT_USERNAME,
    });
  });

  test("should launch student mode", (done) => {
    studentSocket.on(LAUNCH_STUDENT_MODE_EVENT, ({ questions, quizTitle }) => {
      expect(questions).toEqual(QUESTIONS);
      expect(quizTitle).toBe(QUIZ_TITLE);
      done();
    });
    teacherSocket.emit(LAUNCH_STUDENT_MODE_EVENT, {
      roomName: EXPECTED_ROOM_NAME,
      questions: QUESTIONS,
      quizTitle: QUIZ_TITLE
    });
  });

  test("should launch teacher mode", (done) => {
    studentSocket.on(LAUNCH_TEACHER_MODE_EVENT, ({ questions, quizTitle }) => {
      expect(questions).toEqual(QUESTIONS);
      expect(quizTitle).toBe(QUIZ_TITLE);
      done();
    });
    teacherSocket.emit(LAUNCH_TEACHER_MODE_EVENT, {
      roomName: EXPECTED_ROOM_NAME,
      questions: QUESTIONS,
      quizTitle: QUIZ_TITLE
    });
  });

  test("should send next question", (done) => {
    studentSocket.on(NEXT_QUESTION_EVENT, ( question ) => {
      expect(question).toBe(QUESTION_2);
      done();
    });
    teacherSocket.emit(NEXT_QUESTION_EVENT, { roomName: EXPECTED_ROOM_NAME, question: QUESTION_2},
    );
  });

  test("should send answer", (done) => {
    teacherSocket.on(SUBMIT_ANSWER_ROOM_EVENT, (answer) => {
      expect(answer).toEqual({
        idUser: studentSocket.id,
        username: STUDENT_USERNAME,
        answer: ANSWER_1,
        idQuestion: 1,
      });
      done();
    });
    studentSocket.emit(SUBMIT_ANSWER_EVENT, {
      roomName: EXPECTED_ROOM_NAME,
      username: STUDENT_USERNAME,
      answer: ANSWER_1,
      idQuestion: 1,
    });
  });

  test("should not join a room if no room name is provided", (done) => {
    studentSocket.on(JOIN_FAILURE_EVENT, () => {
      done();
    });
    studentSocket.emit(JOIN_ROOM_EVENT, {
      enteredRoomName: "",
      username: STUDENT_USERNAME,
    });
  });

  test("should not join a room if the username is not provided", (done) => {
    studentSocket.on(JOIN_FAILURE_EVENT, () => {
      done();
    });
    studentSocket.emit(JOIN_ROOM_EVENT, { enteredRoomName: NON_EXISTENT_ROOM, username: "" });
  });

  test("should end quiz", (done) => {
    studentSocket.on(END_QUIZ_EVENT, () => {
      done();
    });
    teacherSocket.emit(END_QUIZ_EVENT, {
      roomName: EXPECTED_ROOM_NAME,
    });
  });

  test("should disconnect", (done) => {
    teacherSocket.disconnect();
    studentSocket.disconnect();
    done();
  });
});
