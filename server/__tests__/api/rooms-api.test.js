const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

// Mock logger
jest.mock("../../config/logger", () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
  logUserAction: jest.fn(),
  logApiRequest: jest.fn(),
  logSecurityEvent: jest.fn(),
  logDatabaseOperation: jest.fn(),
}));

// Import the mocked logger
const logger = require("../../config/logger");

// Import request ID middleware
const { requestIdMiddleware } = require("../../config/httpLogger");

// Import the actual components
const RoomsController = require("../../controllers/room");
const jwtMiddleware = require("../../middleware/jwtToken");
const errorHandler = require("../../middleware/errorHandler");
const {
  validateRoomCreation,
  validateRoomRename,
} = require("../../middleware/validation");
const asyncHandler = require("../../routers/routerUtils");

// Mock the database model
const mockRoomsModel = {
  create: jest.fn(),
  getUserRooms: jest.fn(),
  getContent: jest.fn(),
  getOwner: jest.fn(),
  delete: jest.fn(),
  rename: jest.fn(),
  getRoomById: jest.fn(),
  roomExists: jest.fn(),
};

// Create test app with manual routing 
const createTestApp = () => {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Add request ID middleware
  app.use(requestIdMiddleware);

  // Mock logging middleware
  app.use((req, res, next) => {
    req.logAction = (action, details) => {
      if (req.user) {
        logger.logUserAction(req.user.userId, req.user.email, action, details);
      } else {
        logger.warn(`Action attempted without authentication: ${action}`, details);
      }
    };
    req.logSecurity = (event, level, details) => logger.logSecurityEvent(event, level, details);
    req.logDbOperation = (operation, collection, duration, success, details) => logger.logDatabaseOperation(operation, collection, duration, success, details);
    next();
  });

  // Create controller instance with mock model
  const roomsController = new RoomsController(mockRoomsModel);

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

  return app;
};

describe("Rooms API Integration Tests", () => {
  let app;
  let authToken;
  const testUser = {
    email: "test@example.com",
    userId: "user123",
    roles: ["user"],
  };

  beforeAll(() => {
    // Set up JWT secret for testing
    process.env.JWT_SECRET = "test-secret-key";

    // Create auth token for testing
    authToken = jwt.sign(testUser, process.env.JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });
  describe("POST /api/room/create", () => {
    it("should create a room successfully", async () => {
      mockRoomsModel.roomExists.mockResolvedValue(false);
      mockRoomsModel.create.mockResolvedValue({ insertedId: "room123" });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Test Room" })
        .expect(201);

      expect(response.body).toEqual({
        message: "Salle créée avec succès.",
        roomId: "room123",
      });

      expect(mockRoomsModel.roomExists).toHaveBeenCalledWith(
        "TEST ROOM",
        "user123"
      );
      expect(mockRoomsModel.create).toHaveBeenCalledWith(
        "TEST ROOM",
        "user123"
      );

      // Verify logging
      expect(logger.logDatabaseOperation).toHaveBeenCalledWith(
        'insert',
        'rooms',
        expect.any(Number),
        true,
        { roomId: 'room123', roomTitle: 'TEST ROOM' }
      );

      expect(logger.logUserAction).toHaveBeenCalledWith(
        'user123',
        'test@example.com',
        'room_created',
        expect.objectContaining({
          roomId: 'room123',
          roomTitle: 'TEST ROOM',
          createTime: expect.stringMatching(/^\d+ms$/),
          totalTime: expect.stringMatching(/^\d+ms$/)
        })
      );
    });

    it("should return 401 when no auth token provided", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .send({ title: "Test Room" })
        .expect(401);

      expect(response.body.message).toBe("Accès refusé. Aucun jeton fourni.");
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", "Bearer invalid-token")
        .send({ title: "Test Room" })
        .expect(401);

      expect(response.body.message).toBe("Accès refusé. Jeton invalide.");
    });

    it("should return 409 when room already exists", async () => {
      mockRoomsModel.roomExists.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Existing Room" })
        .expect(409);

      expect(response.body.message).toBe("Une salle avec ce nom existe déjà");
    });

    // Input validation tests
    it("should return 400 when title is missing", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain("Données invalides");
    });

    it("should return 400 for empty title", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "" })
        .expect(400);

      expect(response.body.message).toContain("Données invalides");
    });

    it("should return 400 for title with only spaces", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "   " })
        .expect(400);

      expect(response.body.message).toContain("Données invalides");
    });

    it("should return 400 for title that is too long", async () => {
      const longTitle = "A".repeat(26); // Room validation: max length is 25

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: longTitle })
        .expect(400);

      expect(response.body.message).toContain("Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces");
    });

    it("should return 400 for title with invalid characters", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: 'Room<script>alert("xss")</script>' })
        .expect(400);

      expect(response.body.message).toContain("Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces");
    });

    it("should accept title with accented characters", async () => {
      mockRoomsModel.roomExists.mockResolvedValue(false);
      mockRoomsModel.create.mockResolvedValue({ insertedId: "room124" });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Salle de Français" })
        .expect(201);

      expect(response.body.message).toBe("Salle créée avec succès.");
    });

    it("should accept title with various accents", async () => {
      mockRoomsModel.roomExists.mockResolvedValue(false);
      mockRoomsModel.create.mockResolvedValue({ insertedId: "room125" });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Gérard Pâtisserie" })
        .expect(201);

      expect(response.body.message).toBe("Salle créée avec succès.");
    });

    it("should reject SQL injection attempts", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "'; DROP TABLE rooms; --" })
        .expect(400);

      expect(response.body.message).toContain("Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces");
    });

    it("should reject XSS attempts", async () => {
      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: '<script>alert("xss")</script>' })
        .expect(400);

      expect(response.body.message).toContain("Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces");
    });

    it("should accept valid title with mixed characters", async () => {
      mockRoomsModel.roomExists.mockResolvedValue(false);
      mockRoomsModel.create.mockResolvedValue({ insertedId: "room123" });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Valid Room Name 123" })
        .expect(201);

      expect(response.body.roomId).toBe("room123");
    });

    it("should handle minimum valid title length", async () => {
      mockRoomsModel.roomExists.mockResolvedValue(false);
      mockRoomsModel.create.mockResolvedValue({ insertedId: "room123" });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "A" }) // Minimum length
        .expect(201);

      expect(response.body.roomId).toBe("room123");
    });

    it("should handle maximum valid title length", async () => {
      mockRoomsModel.roomExists.mockResolvedValue(false);
      mockRoomsModel.create.mockResolvedValue({ insertedId: "room123" });

      const maxValidTitle = "A".repeat(25); // Room validation: max is 25

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: maxValidTitle })
        .expect(201);

      expect(response.body.roomId).toBe("room123");
    });

    it("should handle title with numbers and special allowed characters", async () => {
      mockRoomsModel.roomExists.mockResolvedValue(false);
      mockRoomsModel.create.mockResolvedValue({ insertedId: "room123" });

      const response = await request(app)
        .post("/api/room/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Room-123_Test Space" })
        .expect(201);

      expect(response.body.roomId).toBe("room123");
    });
  });
  describe("GET /api/room/getUserRooms", () => {
    it("should return user rooms successfully", async () => {
      const mockRooms = [
        { _id: "room1", title: "Room 1", userId: "user123" },
        { _id: "room2", title: "Room 2", userId: "user123" },
      ];
      mockRoomsModel.getUserRooms.mockResolvedValue(mockRooms);

      const response = await request(app)
        .get("/api/room/getUserRooms")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        data: mockRooms,
      });

      expect(mockRoomsModel.getUserRooms).toHaveBeenCalledWith("user123");

      // Verify logging
      expect(logger.logDatabaseOperation).toHaveBeenCalledWith(
        'select',
        'rooms',
        expect.any(Number),
        true,
        { roomCount: 2 }
      );

      expect(logger.logUserAction).toHaveBeenCalledWith(
        'user123',
        'test@example.com',
        'user_rooms_retrieved',
        expect.objectContaining({
          roomCount: 2,
          retrievalTime: expect.stringMatching(/^\d+ms$/)
        })
      );
    });

    it("should return 404 when no rooms found", async () => {
      mockRoomsModel.getUserRooms.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/room/getUserRooms")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe(
        "Aucune salle trouvée avec cet identifiant."
      );
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .get("/api/room/getUserRooms")
        .expect(401);

      expect(response.body.message).toBe("Accès refusé. Aucun jeton fourni.");
    });
  });

  describe("GET /api/room/getRoomContent/:roomId", () => {
    it("should return room content successfully", async () => {
      const roomId = "room123";
      const mockContent = {
        _id: roomId,
        title: "Test Room",
        content: "Room content",
      };
      mockRoomsModel.getContent.mockResolvedValue(mockContent);

      const response = await request(app)
        .get(`/api/room/getRoomContent/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        data: mockContent,
      });

      expect(mockRoomsModel.getContent).toHaveBeenCalledWith(roomId);
    });

    it("should return 500 when content not found", async () => {
      const roomId = "room123";
      mockRoomsModel.getContent.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/room/getRoomContent/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.message).toBe(
        "Une erreur s'est produite lors de la récupération de la salle."
      );
    });
  });
  describe("DELETE /api/room/delete/:roomId", () => {
    it("should delete room successfully", async () => {
      const roomId = "room123";
      mockRoomsModel.getOwner.mockResolvedValue("user123");
      mockRoomsModel.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/room/delete/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: "Salle supprimé avec succès.",
      });

      expect(mockRoomsModel.getOwner).toHaveBeenCalledWith(roomId);
      expect(mockRoomsModel.delete).toHaveBeenCalledWith(roomId);
    });

    it("should return 404 when user is not the owner", async () => {
      const roomId = "room123";
      mockRoomsModel.getOwner.mockResolvedValue("otherUser");

      const response = await request(app)
        .delete(`/api/room/delete/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe(
        "Aucune salle trouvée avec cet identifiant."
      );
    });

    it("should return 500 when delete fails", async () => {
      const roomId = "room123";
      mockRoomsModel.getOwner.mockResolvedValue("user123");
      mockRoomsModel.delete.mockResolvedValue(false);

      const response = await request(app)
        .delete(`/api/room/delete/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.message).toBe(
        "Une erreur s'est produite lors de la suppression de la salle."
      );
    });
  });

  describe("PUT /api/room/rename", () => {
    it("should rename room successfully", async () => {
      const roomId = "room123";
      const newTitle = "New Room Title";
      mockRoomsModel.getOwner.mockResolvedValue("user123");
      mockRoomsModel.roomExists.mockResolvedValue(false);
      mockRoomsModel.rename.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId, newTitle })
        .expect(200);

      expect(response.body).toEqual({
        message: "Salle mis à jour avec succès.",
      });

      expect(mockRoomsModel.getOwner).toHaveBeenCalledWith(roomId);
      expect(mockRoomsModel.roomExists).toHaveBeenCalledWith(
        newTitle,
        "user123"
      );
      expect(mockRoomsModel.rename).toHaveBeenCalledWith(
        roomId,
        "user123",
        newTitle
      );
    });

    it("should return 409 when new title already exists", async () => {
      const roomId = "room123";
      const newTitle = "Existing Title";
      mockRoomsModel.getOwner.mockResolvedValue("user123");
      mockRoomsModel.roomExists.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId, newTitle })
        .expect(409);

      expect(response.body.message).toBe("Une salle avec ce nom existe déjà");
    });

    // Input validation tests
    it("should return 400 when roomId is missing", async () => {
      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ newTitle: "New Title" })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: ID de la salle requis");
    });

    it("should return 400 for empty newTitle", async () => {
      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId: "room123", newTitle: "" })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Nouveau titre requis");
    });

    it("should return 400 for newTitle with only spaces", async () => {
      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId: "room123", newTitle: "   " })
        .expect(400);

      expect(response.body.message).toContain("Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces");
    });

    it("should return 400 for newTitle that is too long", async () => {
      const longTitle = "A".repeat(26); // Room validation: max length is 25

      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId: "room123", newTitle: longTitle })
        .expect(400);

      expect(response.body.message).toContain("Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces");
    });

    it("should return 400 for newTitle with invalid characters", async () => {
      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId: "room123", newTitle: "Room<script>" })
        .expect(400);

      expect(response.body.message).toContain("Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces");
    });

    it("should accept valid newTitle", async () => {
      mockRoomsModel.getOwner.mockResolvedValue("user123");
      mockRoomsModel.roomExists.mockResolvedValue(false);
      mockRoomsModel.rename.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId: "room123", newTitle: "Valid New Name" })
        .expect(200);

      expect(response.body.message).toContain("mis à jour avec succès");
    });

    it("should accept newTitle with accented characters", async () => {
      mockRoomsModel.getOwner.mockResolvedValue("user123");
      mockRoomsModel.roomExists.mockResolvedValue(false);
      mockRoomsModel.rename.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/room/rename")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ roomId: "room123", newTitle: "Salle de Français" })
        .expect(200);

      expect(response.body.message).toContain("mis à jour avec succès");
    });
  });
  describe("GET /api/room/getRoomTitle/:roomId", () => {
    it("should return room title successfully", async () => {
      const roomId = "room123";
      const mockRoom = { _id: roomId, title: "Test Room Title" };
      mockRoomsModel.getRoomById.mockResolvedValue(mockRoom);

      const response = await request(app)
        .get(`/api/room/getRoomTitle/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        title: "Test Room Title",
      });

      expect(mockRoomsModel.getRoomById).toHaveBeenCalledWith(roomId);
    });

    it("should return 404 when room not found", async () => {
      const roomId = "room123";
      mockRoomsModel.getRoomById.mockResolvedValue(new Error("Room not found"));

      const response = await request(app)
        .get(`/api/room/getRoomTitle/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe(
        "Aucune salle trouvée avec cet identifiant."
      );
    });
  });

  describe("GET /api/room/getRoomTitleByUserId/:userId", () => {
    it("should return room titles by user id successfully", async () => {
      const userId = "user123";
      const mockRooms = [
        { _id: "room1", title: "Room 1", userId },
        { _id: "room2", title: "Room 2", userId },
      ];
      mockRoomsModel.getUserRooms.mockResolvedValue(mockRooms);

      const response = await request(app)
        .get(`/api/room/getRoomTitleByUserId/${userId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        titles: ["Room 1", "Room 2"],
      });

      expect(mockRoomsModel.getUserRooms).toHaveBeenCalledWith(userId);
    });

    it("should return 404 when no rooms found", async () => {
      const userId = "user123";
      mockRoomsModel.getUserRooms.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/room/getRoomTitleByUserId/${userId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe(
        "Aucune salle trouvée avec cet identifiant."
      );
    });

    it("should return 404 when empty rooms array", async () => {
      const userId = "user123";
      mockRoomsModel.getUserRooms.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/room/getRoomTitleByUserId/${userId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe(
        "Aucune salle trouvée avec cet identifiant."
      );
    });
  });


});
