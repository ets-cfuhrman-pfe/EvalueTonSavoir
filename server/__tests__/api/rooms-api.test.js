const request = require("supertest");
const {
  HTTP_STATUS,
  TEST_IDS,
  TEST_USERS,
  TEST_DATA,
  COMMON_MESSAGES,
  ROOM_MESSAGES,
  createMockLogger,
  createBaseApp,
  generateAuthToken,
  createMockRoomModel,
  assertSuccess,
  assertAuthError,
  assertOwnershipError,
  assertConflictError,
  assertValidationError,
  assertLogDatabaseOperation,
  assertLogUserAction,
  createTestUser,
  validationConstants,
  GETTING_ROOM_ERROR,
  ROOM_NOT_FOUND,
  DELETE_ROOM_ERROR,
} = require("../setup");

// Import the actual components
const RoomsController = require("../../controllers/room");
const jwtMiddleware = require("../../middleware/jwtToken");
const errorHandler = require("../../middleware/errorHandler");
const { requestIdMiddleware } = require("../../config/httpLogger");
const {
  validateRoomCreation,
  validateRoomRename,
} = require("../../middleware/validation");
const asyncHandler = require("../../routers/routerUtils");

// Create test app with manual routing
const createTestApp = (mockLogger) => {
  const app = createBaseApp(requestIdMiddleware, mockLogger);
  const mockRoomModel = createMockRoomModel();

  // Create controller instance with mock model
  const roomsController = new RoomsController(mockRoomModel);

  // Define routes with validation middleware
  app.post(
    "/api/room/create",
    jwtMiddleware.authenticate,
    validateRoomCreation,
    asyncHandler(roomsController.create)
  );
  app.get(
    "/api/room/getUserRooms",
    jwtMiddleware.authenticate,
    asyncHandler(roomsController.getUserRooms)
  );
  app.get(
    "/api/room/getRoomTitle/:roomId",
    jwtMiddleware.authenticate,
    asyncHandler(roomsController.getRoomTitle)
  );
  app.get(
    "/api/room/getRoomTitleByUserId/:userId",
    jwtMiddleware.authenticate,
    asyncHandler(roomsController.getRoomTitleByUserId)
  );
  app.get(
    "/api/room/getRoomContent/:roomId",
    jwtMiddleware.authenticate,
    asyncHandler(roomsController.getRoomContent)
  );
  app.delete(
    "/api/room/delete/:roomId",
    jwtMiddleware.authenticate,
    asyncHandler(roomsController.delete)
  );
  app.put(
    "/api/room/rename",
    jwtMiddleware.authenticate,
    validateRoomRename,
    asyncHandler(roomsController.rename)
  );

  // Add error handler
  app.use(errorHandler);

  return { app, mockRoomModel };
};

describe("Rooms API Integration Tests", () => {
  let app;
  let mockLogger;
  let mockRoomModel;
  let authToken;

  const testUser = createTestUser();

  beforeAll(() => {
    // Set up JWT secret for testing
    process.env.JWT_SECRET = "test-secret-key";

    // Create auth token for testing
    authToken = generateAuthToken(testUser);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = createMockLogger();
    const testSetup = createTestApp(mockLogger);
    app = testSetup.app;
    mockRoomModel = testSetup.mockRoomModel;
  });
  describe("POST /api/room/create", () => {
    it("should create a room successfully", async () => {
      mockRoomModel.roomExists.mockResolvedValue(false);
      mockRoomModel.create.mockResolvedValue({ insertedId: TEST_IDS.ROOM });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: TEST_DATA.ROOM.VALID.title });

      assertSuccess(response, HTTP_STATUS.CREATED, ROOM_MESSAGES.SUCCESS.CREATED);

      expect(response.body.roomId).toBe(TEST_IDS.ROOM);

      expect(mockRoomModel.roomExists).toHaveBeenCalledWith(
        TEST_DATA.ROOM.VALID.title.toUpperCase(),
        testUser.userId
      );
      expect(mockRoomModel.create).toHaveBeenCalledWith(
        TEST_DATA.ROOM.VALID.title.toUpperCase(),
        testUser.userId
      );

      // Verify logging
      assertLogDatabaseOperation(mockLogger, 'insert', 'rooms');

      assertLogUserAction(
        mockLogger,
        testUser.userId,
        testUser.email,
        'room_created',
        expect.objectContaining({
          roomId: TEST_IDS.ROOM,
          roomTitle: TEST_DATA.ROOM.VALID.title.toUpperCase(),
          createTime: expect.stringMatching(/^\d+ms$/),
          totalTime: expect.stringMatching(/^\d+ms$/)
        })
      );
    });

    it("should return 401 when no auth token provided", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .send({ title: TEST_DATA.ROOM.VALID.title });

      assertAuthError(response);
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", "Bearer invalid-token")
        .send({ title: "Test Room" });

      assertAuthError(response, true);
    });

    it("should return 409 when room already exists", async () => {
      mockRoomModel.roomExists.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: TEST_DATA.ROOM.VALID.title });

      assertConflictError(response, "salle");
    });

    // Input validation tests
    it("should return 400 when title is missing", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      assertValidationError(response, ROOM_MESSAGES.VALIDATION.TITLE_REQUIRED);
    });

    it("should return 400 for empty title", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "" })
        .expect(400);

      expect(response.body.message).toContain(ROOM_MESSAGES.VALIDATION.INVALID_DATA);
    });

    it("should return 400 for title with only spaces", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "   " })
        .expect(400);

      expect(response.body.message).toContain(ROOM_MESSAGES.VALIDATION.INVALID_DATA);
    });

    it("should return 400 for title that is too long", async () => {
      const longTitle = "A".repeat(validationConstants.room.name.maxLength + 1);

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: longTitle })
        .expect(400);

      expect(response.body.message).toContain(ROOM_MESSAGES.VALIDATION.TITLE_LENGTH);
    });

    it("should return 400 for title with invalid characters", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: 'Room<script>alert("xss")</script>' })
        .expect(400);

      expect(response.body.message).toContain(ROOM_MESSAGES.VALIDATION.TITLE_LENGTH);
    });

    it("should accept title with accented characters", async () => {
      mockRoomModel.roomExists.mockResolvedValue(false);
      mockRoomModel.create.mockResolvedValue({ insertedId: TEST_IDS.ROOM_NEW });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Salle de Français" })
        .expect(201);

      expect(response.body.message).toBe(ROOM_MESSAGES.SUCCESS.CREATED);
    });

    it("should accept title with various accents", async () => {
      mockRoomModel.roomExists.mockResolvedValue(false);
      mockRoomModel.create.mockResolvedValue({ insertedId: TEST_IDS.ROOM_NEW });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Gérard Pâtisserie" })
        .expect(201);

      expect(response.body.message).toBe(ROOM_MESSAGES.SUCCESS.CREATED);
    });

    it("should reject SQL injection attempts", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "'; DROP TABLE rooms; --" })
        .expect(400);

      expect(response.body.message).toContain(ROOM_MESSAGES.VALIDATION.TITLE_LENGTH);
    });

    it("should reject XSS attempts", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: '<script>alert("xss")</script>' })
        .expect(400);

      expect(response.body.message).toContain(ROOM_MESSAGES.VALIDATION.TITLE_LENGTH);
    });

    it("should accept valid title with mixed characters", async () => {
      mockRoomModel.roomExists.mockResolvedValue(false);
      mockRoomModel.create.mockResolvedValue({ insertedId: TEST_IDS.ROOM });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: TEST_DATA.ROOM.VALID.title })
        .expect(201);

      expect(response.body.roomId).toBe(TEST_IDS.ROOM);
    });

    it("should handle minimum valid title length", async () => {
      mockRoomModel.roomExists.mockResolvedValue(false);
      mockRoomModel.create.mockResolvedValue({ insertedId: TEST_IDS.ROOM });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: TEST_DATA.ROOM.MINIMAL.title })
        .expect(201);

      expect(response.body.roomId).toBe(TEST_IDS.ROOM);
    });

    it("should handle maximum valid title length", async () => {
      mockRoomModel.roomExists.mockResolvedValue(false);
      mockRoomModel.create.mockResolvedValue({ insertedId: TEST_IDS.ROOM });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: TEST_DATA.ROOM.MAX_TITLE.title })
        .expect(201);

      expect(response.body.roomId).toBe(TEST_IDS.ROOM);
    });

    it("should handle title with numbers and special allowed characters", async () => {
      mockRoomModel.roomExists.mockResolvedValue(false);
      mockRoomModel.create.mockResolvedValue({ insertedId: TEST_IDS.ROOM });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Room-123_Test Space" })
        .expect(201);

      expect(response.body.roomId).toBe(TEST_IDS.ROOM);
    });
  });
  describe("GET /api/room/getUserRooms", () => {
    it("should return user rooms successfully", async () => {
      const mockRooms = [
        { _id: TEST_IDS.ROOM, title: TEST_DATA.ROOM.VALID.title, userId: TEST_USERS.DEFAULT.userId },
        { _id: TEST_IDS.ROOM_NEW, title: `${TEST_DATA.ROOM.VALID.title} 2`, userId: TEST_USERS.DEFAULT.userId },
      ];
      mockRoomModel.getUserRooms.mockResolvedValue(mockRooms);

      const response = await request(app)
        .get("/api/room/getUserRooms")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        data: mockRooms,
      });

      expect(mockRoomModel.getUserRooms).toHaveBeenCalledWith(TEST_USERS.DEFAULT.userId);

      // Verify logging
      assertLogDatabaseOperation(mockLogger, 'select', 'rooms');

      assertLogUserAction(
        mockLogger,
        TEST_USERS.DEFAULT.userId,
        TEST_USERS.DEFAULT.email,
        'user_rooms_retrieved',
        expect.objectContaining({
          roomCount: 2,
          retrievalTime: expect.stringMatching(/^\d+ms$/)
        })
      );
    });

    it("should return 404 when no rooms found", async () => {
      mockRoomModel.getUserRooms.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/room/getUserRooms")
        .set("Authorization", `Bearer ${authToken}`);

      assertOwnershipError(response, "salle");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .get("/api/room/getUserRooms");

      assertAuthError(response);
    });
  });

  describe("GET /api/room/getRoomContent/:roomId", () => {
    it("should return room content successfully", async () => {
      const roomId = TEST_IDS.ROOM;
      const mockContent = {
        _id: roomId,
        title: TEST_DATA.ROOM.VALID.title,
        content: "Room content",
      };
      mockRoomModel.getContent.mockResolvedValue(mockContent);

      const response = await request(app)
        .get(`/api/room/getRoomContent/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        data: mockContent,
      });

      expect(mockRoomModel.getContent).toHaveBeenCalledWith(roomId);
    });

    it("should return 500 when content not found", async () => {
      const roomId = TEST_IDS.ROOM;
      mockRoomModel.getContent.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/room/getRoomContent/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.message).toBe(
        GETTING_ROOM_ERROR.message
      );
    });
  });
  describe("DELETE /api/room/delete/:roomId", () => {
    it("should delete room successfully", async () => {
      const roomId = TEST_IDS.ROOM;
      mockRoomModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockRoomModel.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/room/delete/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: ROOM_MESSAGES.SUCCESS.DELETED,
      });

      expect(mockRoomModel.getOwner).toHaveBeenCalledWith(roomId);
      expect(mockRoomModel.delete).toHaveBeenCalledWith(roomId);
    });

    it("should return 404 when user is not the owner", async () => {
      const roomId = TEST_IDS.ROOM;
      mockRoomModel.getOwner.mockResolvedValue(TEST_USERS.OTHER.userId);

      const response = await request(app)
        .delete(`/api/room/delete/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe(
        ROOM_NOT_FOUND.message
      );
    });

    it("should return 500 when delete fails", async () => {
      const roomId = TEST_IDS.ROOM;
      mockRoomModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockRoomModel.delete.mockResolvedValue(false);

      const response = await request(app)
        .delete(`/api/room/delete/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.message).toBe(
        DELETE_ROOM_ERROR.message
      );
    });
  });

  describe("PUT /api/room/rename", () => {
    it("should rename room successfully", async () => {
      const roomId = TEST_IDS.ROOM;
      const newTitle = TEST_DATA.ROOM.VALID.title;
      mockRoomModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockRoomModel.roomExists.mockResolvedValue(false);
      mockRoomModel.rename.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId, newTitle })
        .expect(200);

      expect(response.body).toEqual({
        message: ROOM_MESSAGES.SUCCESS.UPDATED,
      });

      expect(mockRoomModel.getOwner).toHaveBeenCalledWith(roomId);
      expect(mockRoomModel.roomExists).toHaveBeenCalledWith(
        newTitle,
        TEST_USERS.DEFAULT.userId
      );
      expect(mockRoomModel.rename).toHaveBeenCalledWith(
        roomId,
        TEST_USERS.DEFAULT.userId,
        newTitle
      );
    });

    it("should return 409 when new title already exists", async () => {
      const roomId = TEST_IDS.ROOM;
      const newTitle = TEST_DATA.ROOM.VALID.title;
      mockRoomModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockRoomModel.roomExists.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId, newTitle })
        .expect(409);

      expect(response.body.message).toBe(ROOM_MESSAGES.VALIDATION.ALREADY_EXISTS);
    });

    // Input validation tests
    it("should return 400 when roomId is missing", async () => {
      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ newTitle: TEST_DATA.ROOM.VALID.title });

      assertValidationError(response, "ID de la salle requis");
    });

    it("should return 400 for empty newTitle", async () => {
      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId: TEST_IDS.ROOM, newTitle: "" });

      assertValidationError(response, "Nouveau titre requis");
    });

    it("should return 400 for newTitle with only spaces", async () => {
      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId: TEST_IDS.ROOM, newTitle: "   " });

      assertValidationError(response, ROOM_MESSAGES.VALIDATION.TITLE_LENGTH);
    });

    it("should return 400 for newTitle that is too long", async () => {
      const longTitle = "A".repeat(validationConstants.room.name.maxLength + 1);

      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId: TEST_IDS.ROOM, newTitle: longTitle });

      assertValidationError(response, ROOM_MESSAGES.VALIDATION.TITLE_LENGTH);
    });

    it("should return 400 for newTitle with invalid characters", async () => {
      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId: TEST_IDS.ROOM, newTitle: "Room<script>" });

      assertValidationError(response, ROOM_MESSAGES.VALIDATION.TITLE_LENGTH);
    });

    it("should accept valid newTitle", async () => {
      mockRoomModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockRoomModel.roomExists.mockResolvedValue(false);
      mockRoomModel.rename.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId: TEST_IDS.ROOM, newTitle: TEST_DATA.ROOM.VALID.title })
        .expect(200);

      expect(response.body.message).toContain("mis à jour avec succès");
    });

    it("should accept newTitle with accented characters", async () => {
      mockRoomModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockRoomModel.roomExists.mockResolvedValue(false);
      mockRoomModel.rename.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId: TEST_IDS.ROOM, newTitle: "Salle de Français" })
        .expect(200);

      expect(response.body.message).toContain("mis à jour avec succès");
    });
  });
  describe("GET /api/room/getRoomTitle/:roomId", () => {
    it("should return room title successfully", async () => {
      const roomId = TEST_IDS.ROOM;
      const mockRoom = { _id: roomId, title: TEST_DATA.ROOM.VALID.title };
      mockRoomModel.getRoomById.mockResolvedValue(mockRoom);

      const response = await request(app)
        .get(`/api/room/getRoomTitle/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        title: TEST_DATA.ROOM.VALID.title,
      });

      expect(mockRoomModel.getRoomById).toHaveBeenCalledWith(roomId);
    });

    it("should return 404 when room not found", async () => {
      const roomId = TEST_IDS.ROOM;
      mockRoomModel.getRoomById.mockResolvedValue(new Error("Room not found"));

      const response = await request(app)
        .get(`/api/room/getRoomTitle/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe(
        ROOM_NOT_FOUND.message
      );
    });
  });

  describe("GET /api/room/getRoomTitleByUserId/:userId", () => {
    it("should return room titles by user id successfully", async () => {
      const userId = TEST_USERS.DEFAULT.userId;
      const mockRooms = [
        { _id: TEST_IDS.ROOM, title: TEST_DATA.ROOM.VALID.title, userId },
        { _id: TEST_IDS.ROOM_NEW, title: `${TEST_DATA.ROOM.VALID.title} 2`, userId },
      ];
      mockRoomModel.getUserRooms.mockResolvedValue(mockRooms);

      const response = await request(app)
        .get(`/api/room/getRoomTitleByUserId/${userId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        titles: [TEST_DATA.ROOM.VALID.title, `${TEST_DATA.ROOM.VALID.title} 2`],
      });

      expect(mockRoomModel.getUserRooms).toHaveBeenCalledWith(userId);
    });

    it("should return 404 when no rooms found", async () => {
      const userId = TEST_USERS.DEFAULT.userId;
      mockRoomModel.getUserRooms.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/room/getRoomTitleByUserId/${userId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe(
        ROOM_NOT_FOUND.message
      );
    });

    it("should return 404 when empty rooms array", async () => {
      const userId = TEST_USERS.DEFAULT.userId;
      mockRoomModel.getUserRooms.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/room/getRoomTitleByUserId/${userId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe(
        ROOM_NOT_FOUND.message
      );
    });
  });


});
