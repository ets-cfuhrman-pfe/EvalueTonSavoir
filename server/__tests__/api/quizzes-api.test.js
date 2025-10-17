const request = require("supertest");

// Mock emailer to prevent SMTP connection attempts
jest.mock("../../config/email.js", () => ({
  registerConfirmation: jest.fn(),
  newPasswordConfirmation: jest.fn(),
  quizShare: jest.fn(),
}));

// Import centralized test setup
const {
  HTTP_STATUS,
  TEST_IDS,
  TEST_USERS,
  TEST_DATA,
  COMMON_MESSAGES,
  QUIZ_MESSAGES,
  createMockLogger,
  createMockQuizModel,
  createMockFolderModel,
  createTestUser,
  generateAuthToken,
  createBaseApp,
  assertSuccess,
  assertAuthError,
  assertOwnershipError,
  assertConflictError,
  assertValidationError,
  assertLogUserAction,
  assertLogDatabaseOperation,
  AppError,
  QUIZ_ALREADY_EXISTS,
  MISSING_REQUIRED_PARAMETER,
  QUIZ_NOT_FOUND,
  FOLDER_NOT_FOUND,
  GETTING_QUIZ_ERROR,
  DELETE_QUIZ_ERROR,
  UPDATE_QUIZ_ERROR,
  MOVING_QUIZ_ERROR,
} = require("../setup");

// Import request ID middleware
const { requestIdMiddleware } = require("../../config/httpLogger");

// Import the actual components
const QuizController = require("../../controllers/quiz");
const jwtMiddleware = require("../../middleware/jwtToken");
const errorHandler = require("../../middleware/errorHandler");
const {
  validateQuizCreation,
  validateQuizUpdate,
} = require("../../middleware/validation");
const asyncHandler = require("../../routers/routerUtils");

// Create test app with manual routing
const createTestApp = (mockLogger) => {
  const app = createBaseApp(requestIdMiddleware, mockLogger);
  const mockQuizModel = createMockQuizModel();
  const mockFoldersModel = createMockFolderModel();

  // Create controller instance with mock models
  const quizController = new QuizController(mockQuizModel, mockFoldersModel);

  // Define routes with validation middleware
  app.post(
    "/api/quiz/create",
    jwtMiddleware.authenticate,
    validateQuizCreation,
    asyncHandler(quizController.create)
  );
  app.get(
    "/api/quiz/get/:quizId",
    jwtMiddleware.authenticate,
    asyncHandler(quizController.get)
  );
  app.delete(
    "/api/quiz/delete/:quizId",
    jwtMiddleware.authenticate,
    asyncHandler(quizController.delete)
  );
  app.put(
    "/api/quiz/update",
    jwtMiddleware.authenticate,
    validateQuizUpdate,
    asyncHandler(quizController.update)
  );
  app.put(
    "/api/quiz/move",
    jwtMiddleware.authenticate,
    asyncHandler(quizController.move)
  );
  app.post(
    "/api/quiz/duplicate",
    jwtMiddleware.authenticate,
    asyncHandler(quizController.duplicate)
  );
  app.post(
    "/api/quiz/copy/:quizId",
    jwtMiddleware.authenticate,
    asyncHandler(quizController.copy)
  );
  app.put(
    "/api/quiz/Share",
    jwtMiddleware.authenticate,
    asyncHandler(quizController.share)
  );
  app.get(
    "/api/quiz/getShare/:quizId",
    jwtMiddleware.authenticate,
    asyncHandler(quizController.getShare)
  );
  app.post(
    "/api/quiz/receiveShare",
    jwtMiddleware.authenticate,
    asyncHandler(quizController.receiveShare)
  );

  // Add error handler
  app.use(errorHandler);

  return { app, mockQuizModel, mockFoldersModel };
};

describe("Quizzes API Integration Tests", () => {
  let app;
  let mockLogger;
  let mockQuizModel;
  let mockFoldersModel;
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
    mockQuizModel = testSetup.mockQuizModel;
    mockFoldersModel = testSetup.mockFoldersModel;
  });

  describe("POST /api/quiz/create", () => {
    it("should create a quiz successfully", async () => {
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockQuizModel.create.mockResolvedValue(TEST_IDS.QUIZ);

      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      assertSuccess(response, HTTP_STATUS.OK, QUIZ_MESSAGES.SUCCESS.CREATED);

      expect(mockFoldersModel.getOwner).toHaveBeenCalledWith(TEST_IDS.FOLDER);
      expect(mockQuizModel.create).toHaveBeenCalledWith(
        TEST_DATA.QUIZ.VALID.title,
        TEST_DATA.QUIZ.VALID.content,
        TEST_IDS.FOLDER,
        TEST_USERS.DEFAULT.userId
      );

      // Verify logging
      assertLogDatabaseOperation(mockLogger, "insert", "quizzes");
      assertLogUserAction(
        mockLogger,
        TEST_USERS.DEFAULT.userId,
        TEST_USERS.DEFAULT.email,
        "quiz_created"
      );
    });

    it("should return 401 when no auth token provided", async () => {
      const response = await request(app).post("/api/quiz/create").send({
        title: TEST_DATA.QUIZ.VALID.title,
        content: TEST_DATA.QUIZ.VALID.content,
        folderId: TEST_IDS.FOLDER,
      });

      assertAuthError(response);
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      assertAuthError(response, true);
    });

    it("should return 404 when folder not found or not owned by user", async () => {
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.OTHER.userId);

      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      assertOwnershipError(response, "dossier");
    });

    it("should return 409 when quiz already exists", async () => {
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockQuizModel.create.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Existing Quiz",
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      assertConflictError(response, "quiz");
    });

    // Input validation tests
    it("should return 400 when title is missing", async () => {
      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      assertValidationError(response, QUIZ_MESSAGES.VALIDATION.TITLE_REQUIRED);
    });

    it("should return 400 when content is missing", async () => {
      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          folderId: TEST_IDS.FOLDER,
        });

      assertValidationError(response, QUIZ_MESSAGES.VALIDATION.CONTENT_REQUIRED);
    });

    it("should return 400 when folderId is missing", async () => {
      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: TEST_DATA.QUIZ.VALID.content,
        });

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
    });

    it("should return 400 for empty title", async () => {
      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "",
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      assertValidationError(response, QUIZ_MESSAGES.VALIDATION.TITLE_REQUIRED);
    });

    it("should return 400 for title too long", async () => {
      // Mock folder owner to ensure validation focuses on title length
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      
      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.OVERSIZED_TITLE.title,
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      assertValidationError(
        response,
        QUIZ_MESSAGES.VALIDATION.TITLE_LENGTH
      );
    });

    it("should return 400 for empty content", async () => {
      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: "",
          folderId: TEST_IDS.FOLDER,
        });

      assertValidationError(response, QUIZ_MESSAGES.VALIDATION.CONTENT_REQUIRED);
    });

    it("should return 400 for content too long", async () => {
      // Mock folder owner to ensure validation focuses on content length
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      
      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: TEST_DATA.QUIZ.OVERSIZED_CONTENT.content,
          folderId: TEST_IDS.FOLDER,
        });

      assertValidationError(
        response,
        QUIZ_MESSAGES.VALIDATION.CONTENT_LENGTH
      );
    });

    it("should accept valid quiz creation", async () => {
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockQuizModel.create.mockResolvedValue(TEST_IDS.QUIZ);

      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      assertSuccess(response, HTTP_STATUS.OK, QUIZ_MESSAGES.SUCCESS.CREATED);
    });

    it("should handle creating quiz with same title/folder twice (idempotency)", async () => {
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockQuizModel.create
        .mockResolvedValueOnce(TEST_IDS.QUIZ) // First call succeeds
        .mockResolvedValueOnce(null); // Second call fails

      // First creation succeeds
      const response1 = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      assertSuccess(response1, HTTP_STATUS.OK, QUIZ_MESSAGES.SUCCESS.CREATED);

      // Second creation with same data should fail with 409
      const response2 = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      assertConflictError(response2, "quiz");
    });

    it("should handle concurrent quiz creation attempts", async () => {
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockQuizModel.create
        .mockResolvedValueOnce(TEST_IDS.QUIZ) // First request succeeds
        .mockResolvedValueOnce(null); // Second request fails

      // Simulate concurrent requests
      const request1 = request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Concurrent Quiz",
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      const request2 = request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Concurrent Quiz",
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      const [response1, response2] = await Promise.all([request1, request2]);

      // One should succeed, one should fail
      const successResponse = response1.status === 200 ? response1 : response2;
      const conflictResponse = response1.status === 409 ? response1 : response2;

      assertSuccess(successResponse, HTTP_STATUS.OK, QUIZ_MESSAGES.SUCCESS.CREATED);
      assertConflictError(conflictResponse, "quiz");
    });

    it("should return 500 when folder ownership check fails with database error", async () => {
      mockFoldersModel.getOwner.mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_ERROR);
      expect(response.body.message).toBeDefined();
    });

    it("should return 500 when quiz creation fails with database error", async () => {
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockQuizModel.create.mockRejectedValue(
        new Error("Database insert failed")
      );

      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_ERROR);
      expect(response.body.message).toBeDefined();
    });

    it("should handle malformed content array gracefully", async () => {
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockQuizModel.create.mockResolvedValue(TEST_IDS.QUIZ);

      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: "not an array",
          folderId: TEST_IDS.FOLDER,
        });

      // This should not crash
      expect([HTTP_STATUS.OK, HTTP_STATUS.INTERNAL_ERROR]).toContain(
        response.status
      );
    });

    it("should return 400 for empty content array", async () => {
      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: [], 
          folderId: TEST_IDS.FOLDER,
        });

      assertValidationError(response, QUIZ_MESSAGES.VALIDATION.CONTENT_LENGTH);
    });

    it("should return 409 when quiz with same title/folder/user already exists", async () => {
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockQuizModel.create.mockRejectedValue(new AppError(QUIZ_ALREADY_EXISTS));

      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      assertConflictError(response, "quiz");
    });

    it("should return 500 when creating multiple quizzes with same name causes database error", async () => {
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockQuizModel.create.mockRejectedValue(
        new Error("Duplicate key constraint violation")
      );

      const response = await request(app)
        .post("/api/quiz/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: TEST_DATA.QUIZ.VALID.title,
          content: TEST_DATA.QUIZ.VALID.content,
          folderId: TEST_IDS.FOLDER,
        });

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_ERROR);
      expect(response.body.message).toBeDefined();
    });

    describe("GET /api/quiz/get/:quizId", () => {
      it("should return quiz content successfully", async () => {
        const quizId = TEST_IDS.QUIZ;
        const mockContent = {
          _id: quizId,
          title: "Test Quiz",
          content: TEST_DATA.QUIZ.VALID.content,
          userId: TEST_USERS.DEFAULT.userId,
        };
        mockQuizModel.getContent.mockResolvedValue(mockContent);

        const response = await request(app)
          .get(`/api/quiz/get/${quizId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toEqual({
          data: mockContent,
        });

        expect(mockQuizModel.getContent).toHaveBeenCalledWith(quizId);
      });

      it("should return 500 when quiz not found", async () => {
        const quizId = TEST_IDS.QUIZ;
        mockQuizModel.getContent.mockResolvedValue(null);

        const response = await request(app)
          .get(`/api/quiz/get/${quizId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(500);

        expect(response.body.message).toBe(
          GETTING_QUIZ_ERROR.message
        );
      });

      it("should return 404 when user is not the owner", async () => {
        const quizId = TEST_IDS.QUIZ;
        const mockContent = {
          _id: quizId,
          title: "Test Quiz",
          content: TEST_DATA.QUIZ.VALID.content,
          userId: TEST_USERS.OTHER.userId,
        };
        mockQuizModel.getContent.mockResolvedValue(mockContent);

        const response = await request(app)
          .get(`/api/quiz/get/${quizId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.message).toBe(
          QUIZ_NOT_FOUND.message
        );
      });

      it("should return 401 when not authenticated", async () => {
        const response = await request(app)
          .get("/api/quiz/get/quiz123")
          .expect(401);

        expect(response.body.message).toBe(COMMON_MESSAGES.AUTH.ACCESS_DENIED);
      });
    });

    describe("DELETE /api/quiz/delete/:quizId", () => {
      it("should delete quiz successfully", async () => {
        const quizId = TEST_IDS.QUIZ;
        mockQuizModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
        mockQuizModel.delete.mockResolvedValue(true);

        const response = await request(app)
          .delete(`/api/quiz/delete/${quizId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toEqual({
          message: QUIZ_MESSAGES.SUCCESS.DELETED,
        });

        expect(mockQuizModel.getOwner).toHaveBeenCalledWith(quizId);
        expect(mockQuizModel.delete).toHaveBeenCalledWith(quizId);
      });

      it("should return 404 when user is not the owner", async () => {
        const quizId = TEST_IDS.QUIZ;
        mockQuizModel.getOwner.mockResolvedValue(TEST_USERS.OTHER.userId);

        const response = await request(app)
          .delete(`/api/quiz/delete/${quizId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.message).toBe(
          QUIZ_NOT_FOUND.message
        );
      });

      it("should return 500 when delete fails", async () => {
        const quizId = TEST_IDS.QUIZ;
        mockQuizModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
        mockQuizModel.delete.mockResolvedValue(false);

        const response = await request(app)
          .delete(`/api/quiz/delete/${quizId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(500);

      expect(response.body.message).toBe("Une erreur s'est produite lors de la suppression du quiz.");
    });
    it("should handle content.content as an array correctly", async () => {
      const quizId = "quiz123";
      
      // Mock quiz content with content as an array (should now work correctly)
      const mockContentWithArrayContent = {
        _id: quizId,
        title: "Test Quiz",
        content: ["Question 1?", "Question 2?"], 
        userId: "user123",
        folderId: "folder123"
      };
      
      mockQuizModel.getOwner.mockResolvedValue("user123");
      mockQuizModel.getContent.mockResolvedValue(mockContentWithArrayContent);
      mockQuizModel.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/quiz/delete/${quizId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200); // Should now succeed with the fix

      expect(response.body).toEqual({
        message: "Quiz supprimé avec succès.",
      });

      expect(mockQuizModel.getOwner).toHaveBeenCalledWith(quizId);
      expect(mockQuizModel.getContent).toHaveBeenCalledWith(quizId);
      expect(mockQuizModel.delete).toHaveBeenCalledWith(quizId);
    });

      it("should return 401 when not authenticated", async () => {
        const response = await request(app)
          .delete("/api/quiz/delete/quiz123")
          .expect(401);

        expect(response.body.message).toBe(COMMON_MESSAGES.AUTH.ACCESS_DENIED);
      });
    });

    describe("PUT /api/quiz/update", () => {
      it("should update quiz successfully", async () => {
        const quizId = TEST_IDS.QUIZ;
        const newTitle = "Updated Quiz Title";
        const newContent = "Updated quiz content";
        mockQuizModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
        mockQuizModel.update.mockResolvedValue(true);

        const response = await request(app)
          .put("/api/quiz/update")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ quizId, newTitle, newContent })
          .expect(200);

        expect(response.body).toEqual({
          message: QUIZ_MESSAGES.SUCCESS.UPDATED,
        });

        expect(mockQuizModel.getOwner).toHaveBeenCalledWith(quizId);
        expect(mockQuizModel.update).toHaveBeenCalledWith(
          quizId,
          newTitle,
          newContent
        );
      });

      it("should return 404 when user is not the owner", async () => {
        const quizId = TEST_IDS.QUIZ;
        mockQuizModel.getOwner.mockResolvedValue(TEST_USERS.OTHER.userId);

        const response = await request(app)
          .put("/api/quiz/update")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ quizId, newTitle: TEST_DATA.QUIZ.VALID.title, newContent: "New content" })
          .expect(404);

        expect(response.body.message).toBe(
          QUIZ_NOT_FOUND.message
        );
      });

      it("should return 500 when update fails", async () => {
        const quizId = TEST_IDS.QUIZ;
        mockQuizModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
        mockQuizModel.update.mockResolvedValue(false);

        const response = await request(app)
          .put("/api/quiz/update")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ quizId, newTitle: TEST_DATA.QUIZ.VALID.title, newContent: "New content" })
          .expect(500);

        expect(response.body.message).toBe(
          UPDATE_QUIZ_ERROR.message
        );
      });

      // Input validation tests
      it("should return 400 when quizId is missing", async () => {
        const response = await request(app)
          .put("/api/quiz/update")
          .set("Authorization", `Bearer ${authToken}`)
        .send({ newTitle: TEST_DATA.QUIZ.VALID.title, newContent: "New content" })
        .expect(400);

      expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
    });      it("should return 400 when newTitle is missing", async () => {
        const response = await request(app)
          .put("/api/quiz/update")
          .set("Authorization", `Bearer ${authToken}`)
        .send({ quizId: TEST_IDS.QUIZ, newContent: "New content" })
        .expect(400);

      expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
    });      it("should return 400 when newContent is missing", async () => {
        const response = await request(app)
          .put("/api/quiz/update")
          .set("Authorization", `Bearer ${authToken}`)
        .send({ quizId: TEST_IDS.QUIZ, newTitle: TEST_DATA.QUIZ.VALID.title })
        .expect(400);

      expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
    });      it("should return 400 for empty newTitle", async () => {
        const response = await request(app)
          .put("/api/quiz/update")
          .set("Authorization", `Bearer ${authToken}`)
        .send({ quizId: TEST_IDS.QUIZ, newTitle: "", newContent: "New content" })
        .expect(400);

      expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
    });
    
    it("should return 400 for newTitle too long", async () => {
        const longTitle = TEST_DATA.QUIZ.OVERSIZED_TITLE.title;
        mockQuizModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
        mockQuizModel.update.mockResolvedValue(false);

        const response = await request(app)
          .put("/api/quiz/update")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            quizId: TEST_IDS.QUIZ,
            newTitle: longTitle,
            newContent: "New content",
          })
          .expect(400);

        expect(response.body.message).toContain(QUIZ_MESSAGES.VALIDATION.TITLE_LENGTH);
      });

      it("should return 400 for empty newContent", async () => {
        const response = await request(app)
          .put("/api/quiz/update")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ quizId: TEST_IDS.QUIZ, newTitle: TEST_DATA.QUIZ.VALID.title, newContent: "" })
          .expect(400);

        expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
      });

      it("should return 400 for newContent too long", async () => {
        const longContent = TEST_DATA.QUIZ.OVERSIZED_CONTENT.content;
        mockQuizModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);

        const response = await request(app)
          .put("/api/quiz/update")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            quizId: TEST_IDS.QUIZ,
            newTitle: TEST_DATA.QUIZ.VALID.title,
            newContent: longContent,
          })
          .expect(400);

        expect(response.body.message).toContain(QUIZ_MESSAGES.VALIDATION.CONTENT_LENGTH);
      });
    });

    describe("PUT /api/quiz/move", () => {
      it("should move quiz successfully", async () => {
        const quizId = TEST_IDS.QUIZ;
        const newFolderId = TEST_DATA.FOLDER.VALID.title;
        mockQuizModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
        mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
        mockQuizModel.move.mockResolvedValue(true);

        const response = await request(app)
          .put("/api/quiz/move")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ quizId, newFolderId })
          .expect(200);

        expect(response.body).toEqual({
          message: QUIZ_MESSAGES.SUCCESS.MOVED,
        });

        expect(mockQuizModel.getOwner).toHaveBeenCalledWith(quizId);
        expect(mockFoldersModel.getOwner).toHaveBeenCalledWith(newFolderId);
        expect(mockQuizModel.move).toHaveBeenCalledWith(quizId, newFolderId);
      });

      it("should return 404 when user is not the quiz owner", async () => {
        const quizId = TEST_IDS.QUIZ;
        mockQuizModel.getOwner.mockResolvedValue(TEST_USERS.OTHER.userId);

        const response = await request(app)
          .put("/api/quiz/move")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ quizId, newFolderId: TEST_DATA.FOLDER.VALID.title })
          .expect(404);

        expect(response.body.message).toBe(
          QUIZ_NOT_FOUND.message
        );
      });

      it("should return 404 when user is not the folder owner", async () => {
        const quizId = TEST_IDS.QUIZ;
        mockQuizModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
        mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.OTHER.userId);

        const response = await request(app)
          .put("/api/quiz/move")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ quizId, newFolderId: TEST_DATA.FOLDER.VALID.title })
          .expect(404);

        expect(response.body.message).toBe(
          FOLDER_NOT_FOUND.message
        );
      });

      it("should return 500 when move fails", async () => {
        const quizId = TEST_IDS.QUIZ;
        mockQuizModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
        mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
        mockQuizModel.move.mockResolvedValue(false);

        const response = await request(app)
          .put("/api/quiz/move")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ quizId, newFolderId: TEST_DATA.FOLDER.VALID.title })
          .expect(500);

        expect(response.body.message).toBe(
          MOVING_QUIZ_ERROR.message
        );
      });

      it("should return 400 when quizId is missing", async () => {
        const response = await request(app)
          .put("/api/quiz/move")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ newFolderId: TEST_DATA.FOLDER.VALID.title })
          .expect(400);

        expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
      });

      it("should return 400 when newFolderId is missing", async () => {
        const response = await request(app)
          .put("/api/quiz/move")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ quizId: TEST_IDS.QUIZ })
          .expect(400);

        expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
      });
    });

    describe("POST /api/quiz/duplicate", () => {
      it("should duplicate quiz successfully", async () => {
        const quizId = TEST_IDS.QUIZ;
        mockQuizModel.duplicate.mockResolvedValue(TEST_IDS.QUIZ_NEW);

        const response = await request(app)
          .post("/api/quiz/duplicate")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ quizId })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          newQuizId: TEST_IDS.QUIZ_NEW,
        });

        expect(mockQuizModel.duplicate).toHaveBeenCalledWith(quizId, TEST_USERS.DEFAULT.userId);
      });
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post("/api/quiz/duplicate")
        .send({ quizId: TEST_IDS.QUIZ })
        .expect(401);

      expect(response.body.message).toBe(COMMON_MESSAGES.AUTH.ACCESS_DENIED);
    });
  });

  describe("POST /api/quiz/copy/:quizId", () => {
    it("should return 400 for missing required parameters", async () => {
      const response = await request(app)
        .post(`/api/quiz/copy/${TEST_IDS.QUIZ}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
    });
  });

  describe("PUT /api/quiz/Share", () => {
    beforeAll(() => {
      process.env.FRONTEND_URL = "http://localhost:3000";
    });

    it("should share quiz successfully", async () => {
      const quizId = TEST_IDS.QUIZ;
      const email = TEST_USERS.OTHER.email;

      const response = await request(app)
        .put("/api/quiz/Share")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ quizId, email })
        .expect(200);

      expect(response.body).toEqual({
        message: QUIZ_MESSAGES.SUCCESS.SHARED,
      });
    });

    it("should return 400 when quizId is missing", async () => {
      const response = await request(app)
        .put("/api/quiz/Share")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ email: TEST_USERS.OTHER.email })
        .expect(400);

      expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .put("/api/quiz/Share")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ quizId: TEST_IDS.QUIZ })
        .expect(400);

      expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
    });
  });

  describe("GET /api/quiz/getShare/:quizId", () => {
    it("should return shared quiz title successfully", async () => {
      const quizId = TEST_IDS.QUIZ;
      const mockContent = {
        _id: quizId,
        title: TEST_DATA.QUIZ.VALID.title,
        content: TEST_DATA.QUIZ.VALID.content,
      };
      mockQuizModel.getContent.mockResolvedValue(mockContent);

      const response = await request(app)
        .get(`/api/quiz/getShare/${quizId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        data: TEST_DATA.QUIZ.VALID.title,
      });

      expect(mockQuizModel.getContent).toHaveBeenCalledWith(quizId);
    });

    it("should return 500 when quiz not found", async () => {
      const quizId = TEST_IDS.QUIZ;
      mockQuizModel.getContent.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/quiz/getShare/${quizId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.message).toBe(
        GETTING_QUIZ_ERROR.message
      );
    });
  });

  describe("POST /api/quiz/receiveShare", () => {
    it("should receive shared quiz successfully", async () => {
      const quizId = TEST_IDS.QUIZ;
      const folderId = TEST_IDS.FOLDER;
      const mockContent = {
        title: TEST_DATA.QUIZ.VALID.title,
        content: TEST_DATA.QUIZ.VALID.content,
      };
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockQuizModel.getContent.mockResolvedValue(mockContent);
      mockQuizModel.create.mockResolvedValue(TEST_IDS.QUIZ_NEW);

      const response = await request(app)
        .post("/api/quiz/receiveShare")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ quizId, folderId })
        .expect(200);

      expect(response.body).toEqual({
        message: QUIZ_MESSAGES.SUCCESS.RECEIVED_SHARE,
      });

      expect(mockFoldersModel.getOwner).toHaveBeenCalledWith(folderId);
      expect(mockQuizModel.getContent).toHaveBeenCalledWith(quizId);
      expect(mockQuizModel.create).toHaveBeenCalledWith(
        TEST_DATA.QUIZ.VALID.title,
        TEST_DATA.QUIZ.VALID.content,
        folderId,
        TEST_USERS.DEFAULT.userId
      );
    });

    it("should return 404 when folder not owned by user", async () => {
      const quizId = TEST_IDS.QUIZ;
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.OTHER.userId);

      const response = await request(app)
        .post("/api/quiz/receiveShare")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ quizId, folderId: TEST_IDS.FOLDER })
        .expect(404);

      expect(response.body.message).toBe(
        FOLDER_NOT_FOUND.message
      );
    });

    it("should return 500 when shared quiz not found", async () => {
      const quizId = TEST_IDS.QUIZ;
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockQuizModel.getContent.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/quiz/receiveShare")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ quizId, folderId: TEST_IDS.FOLDER })
        .expect(500);

      expect(response.body.message).toBe(
        GETTING_QUIZ_ERROR.message
      );
    });

    it("should return 409 when quiz already exists in folder", async () => {
      const quizId = TEST_IDS.QUIZ;
      const mockContent = {
        title: TEST_DATA.QUIZ.VALID.title,
        content: TEST_DATA.QUIZ.VALID.content,
      };
      mockFoldersModel.getOwner.mockResolvedValue(TEST_USERS.DEFAULT.userId);
      mockQuizModel.getContent.mockResolvedValue(mockContent);
      mockQuizModel.create.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/quiz/receiveShare")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ quizId, folderId: TEST_IDS.FOLDER })
        .expect(409);

      expect(response.body.message).toBe(QUIZ_MESSAGES.ERRORS.ALREADY_EXISTS);
    });

    it("should return 400 when quizId is missing", async () => {
      const response = await request(app)
        .post("/api/quiz/receiveShare")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ folderId: TEST_IDS.FOLDER })
        .expect(400);

      expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
    });

    it("should return 400 when folderId is missing", async () => {
      const response = await request(app)
        .post("/api/quiz/receiveShare")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ quizId: TEST_IDS.QUIZ })
        .expect(400);

      expect(response.body.message).toBe(MISSING_REQUIRED_PARAMETER.message);
    });
  });
});
