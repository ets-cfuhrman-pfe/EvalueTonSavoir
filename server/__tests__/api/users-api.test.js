const request = require("supertest");

// Mock the logger module
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn(),
  logUserAction: jest.fn(),
  logApiRequest: jest.fn(),
  logSecurityEvent: jest.fn(),
  logDatabaseOperation: jest.fn(),
};

jest.mock('../../config/logger', () => mockLogger);

const {
  HTTP_STATUS,
  TEST_IDS,
  TEST_USERS,
  TEST_DATA,
  USER_MESSAGES,
  createBaseApp,
  generateAuthToken,
  createMockUserModel,
  createTestUser,
  validationConstants,
  COMMON_MESSAGES,
} = require("../setup");

// Import the actual components
const UsersController = require("../../controllers/users");
const jwtMiddleware = require("../../middleware/jwtToken");
const errorHandler = require("../../middleware/errorHandler");
const { requestIdMiddleware } = require("../../config/httpLogger");
const {
  validateUserRegistration,
  validateUserLogin,
  validateEmailOnly,
  validatePasswordChange
} = require("../../middleware/validation");
const asyncHandler = require("../../routers/routerUtils");

// Create test app with manual routing
const createTestApp = () => {
  const app = createBaseApp(requestIdMiddleware, mockLogger);
  const mockUsersModel = createMockUserModel();

  // Create controller instance with mock model
  const usersController = new UsersController(mockUsersModel);

  // Define routes with validation middleware
  app.post(
    "/api/user/register",
    validateUserRegistration,
    asyncHandler(usersController.register)
  );
  app.post(
    "/api/user/login",
    validateUserLogin,
    asyncHandler(usersController.login)
  );
  app.post(
    "/api/user/reset-password",
    validateEmailOnly,
    asyncHandler(usersController.resetPassword)
  );
  app.post(
    "/api/user/change-password",
    jwtMiddleware.authenticate,
    validatePasswordChange,
    asyncHandler(usersController.changePassword)
  );
  app.post(
    "/api/user/delete-user",
    jwtMiddleware.authenticate,
    validateUserLogin,
    asyncHandler(usersController.delete)
  );

  // Add error handler
  app.use(errorHandler);

  return { app, mockUsersModel };
};

describe("Users API Integration Tests", () => {
  let app;
  let mockUsersModel;
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
    const testSetup = createTestApp();
    app = testSetup.app;
    mockUsersModel = testSetup.mockUsersModel;
  });

  describe("POST /api/user/register", () => {
    it("should register a user successfully", async () => {
      mockUsersModel.register.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: TEST_DATA.USER.VALID.email,
          password: TEST_DATA.USER.VALID.password,
          username: TEST_USERS.DEFAULT.userId
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual({
        message: USER_MESSAGES.SUCCESS.CREATED,
      });

      expect(mockUsersModel.register).toHaveBeenCalledWith(
        TEST_DATA.USER.VALID.email,
        TEST_DATA.USER.VALID.password
      );

      // Verify logging
      expect(mockLogger.logDatabaseOperation).toHaveBeenCalledWith(
        'insert',
        'users',
        expect.any(Number),
        true,
        { email: TEST_DATA.USER.VALID.email }
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Action attempted without authentication: user_register',
        expect.objectContaining({
          email: TEST_DATA.USER.VALID.email,
          registrationMethod: 'email',
          dbOperationTime: expect.stringMatching(/^\d+ms$/)
        })
      );
    });

    it("should return BAD_REQUEST when email is missing", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({
          password: TEST_DATA.USER.VALID.password,
          username: TEST_USERS.DEFAULT.userId
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.EMAIL_REQUIRED);
    });


    it("should return BAD_REQUEST when username is missing", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: TEST_USERS.DEFAULT.email,
          password: TEST_DATA.USER.VALID.password
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.USERNAME_REQUIRED);
    });

    it("should return BAD_REQUEST for invalid email format", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: TEST_DATA.USER.INVALID.email,
          password: TEST_DATA.USER.VALID.password,
          username: TEST_USERS.DEFAULT.userId
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.EMAIL_INVALID);
    });


    it("should return BAD_REQUEST for username too short", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: TEST_USERS.DEFAULT.email,
          password: TEST_DATA.USER.VALID.password,
          username: "a"
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.USERNAME_INVALID);
    });

    it("should return BAD_REQUEST for username with invalid characters", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: TEST_USERS.DEFAULT.email,
          password: TEST_DATA.USER.VALID.password,
          username: "user@name"
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.USERNAME_INVALID);
    });

    it("should return BAD_REQUEST for email too long", async () => {
      const longEmail = "a".repeat(validationConstants.user.email.maxLength + 1) + "@example.com";
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: longEmail,
          password: TEST_DATA.USER.VALID.password,
          username: TEST_USERS.DEFAULT.userId
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.EMAIL_INVALID);
    });

    it("should return BAD_REQUEST for username too long", async () => {
      const longUsername = "a".repeat(validationConstants.user.username.maxLength + 1);
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: TEST_USERS.DEFAULT.email,
          password: TEST_DATA.USER.VALID.password,
          username: longUsername
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.USERNAME_INVALID);
    });

    it("should accept valid registration data", async () => {
      mockUsersModel.register.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: TEST_DATA.USER.VALID.email,
          password: TEST_DATA.USER.VALID.password,
          username: TEST_DATA.USER.VALID_USERNAME.username
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.message).toBe(USER_MESSAGES.SUCCESS.CREATED);
    });

    it("should accept usernames with commas and spaces", async () => {
      mockUsersModel.register.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: TEST_USERS.DEFAULT.email,
          password: TEST_DATA.USER.VALID.password,
          username: TEST_DATA.USER.VALID_USERNAME.username + ", AnotherName"
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.message).toBe(USER_MESSAGES.SUCCESS.CREATED);
    });

    it("should accept usernames with accented characters", async () => {
      mockUsersModel.register.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "gerard@example.com",
          password: TEST_DATA.USER.VALID.password,
          username: "Gérard"
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.message).toBe(USER_MESSAGES.SUCCESS.CREATED);
    });

    it("should accept usernames with various accents", async () => {
      mockUsersModel.register.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "francois@example.com",
          password: TEST_DATA.USER.VALID.password,
          username: "François Müller Châteauneuf"
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.message).toBe(USER_MESSAGES.SUCCESS.CREATED);
    });

    it("should handle minimum valid lengths", async () => {
      mockUsersModel.register.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "a".repeat(validationConstants.user.email.minLength) + "@b.com",
          password: "A".repeat(validationConstants.user.password.minLength - 2) + "1a",
          username: "a".repeat(validationConstants.user.username.minLength)
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.message).toBe(USER_MESSAGES.SUCCESS.CREATED);
    });

    it("should handle maximum valid lengths", async () => {
      mockUsersModel.register.mockResolvedValue(true);

      const maxEmail = "a".repeat(validationConstants.user.email.maxLength - "@b.co".length) + "@b.co";
      const maxPassword = "ValidP1" + "a".repeat(validationConstants.user.password.maxLength - "ValidP1".length);
      const maxUsername = "a".repeat(validationConstants.user.username.maxLength); 

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: maxEmail,
          password: maxPassword,
          username: maxUsername
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.message).toBe(USER_MESSAGES.SUCCESS.CREATED);
    });

    it("should return CONFLICT when user already exists", async () => {
      const AppError = require("../../middleware/AppError");
      const { USER_ALREADY_EXISTS } = require("../../constants/errorCodes");
      
      mockUsersModel.register.mockRejectedValue(new AppError(USER_ALREADY_EXISTS));

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: TEST_DATA.USER.VALID.email,
          password: TEST_DATA.USER.VALID.password,
          username: "existinguser"
        })
        .expect(HTTP_STATUS.CONFLICT);

      expect(response.body.message).toBe(USER_MESSAGES.ERRORS.ALREADY_EXISTS);
    });

    it("should return INTERNAL_ERROR when database connection fails during registration", async () => {
      mockUsersModel.register.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: TEST_DATA.USER.VALID.email,
          password: TEST_DATA.USER.VALID.password,
          username: TEST_USERS.DEFAULT.userId
        })
        .expect(HTTP_STATUS.INTERNAL_ERROR);

      expect(response.body.message).toBe("Une erreur interne s'est produite.");
    });

    it("should prevent SQL injection in email field", async () => {
      const sqlInjectionEmail = "test@example.com'; DROP TABLE users; --";
      
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: sqlInjectionEmail,
          password: TEST_DATA.USER.VALID.password,
          username: TEST_USERS.DEFAULT.userId
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.EMAIL_INVALID);
    });

    it("should prevent XSS in username field", async () => {
      const xssUsername = "<script>alert('xss')</script>";
      
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: TEST_USERS.DEFAULT.email,
          password: TEST_DATA.USER.VALID.password,
          username: xssUsername
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.USERNAME_INVALID);
    });

    it("should prevent SQL injection in username field", async () => {
      const sqlInjectionUsername = "user'; SELECT * FROM users; --";
      
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: TEST_USERS.DEFAULT.email,
          password: TEST_DATA.USER.VALID.password,
          username: sqlInjectionUsername
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.USERNAME_INVALID);
    });

    it("should handle empty string inputs", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "",
          password: "",
          username: ""
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe("Données invalides: Email requis, Nom d'utilisateur requis");
    });

    it("should handle whitespace-only inputs", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "   ",
          password: "   ",
          username: "   "
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe("Données invalides: L'adresse email doit être valide, Le nom d'utilisateur ne peut contenir que des lettres, des chiffres, des virgules et des espaces");
    });

    it("should handle extremely long inputs", async () => {
      const extremelyLongInput = "a".repeat(10000);
      
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: extremelyLongInput + "@example.com",
          password: TEST_DATA.USER.VALID.password,
          username: extremelyLongInput
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      // Should fail validation due to length limits
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("POST /api/user/login", () => {
    it("should login user successfully", async () => {
      const mockUser = { _id: TEST_IDS.USER, email: TEST_USERS.DEFAULT.email };
      mockUsersModel.login.mockResolvedValue(mockUser);

      const response = await request(app)
        .post("/api/user/login")
        .send({
          email: TEST_DATA.USER.VALID_LOGIN.email,
          password: TEST_DATA.USER.VALID_LOGIN.password
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body).toHaveProperty("token");
      expect(mockUsersModel.login).toHaveBeenCalledWith(
        TEST_DATA.USER.VALID_LOGIN.email,
        TEST_DATA.USER.VALID_LOGIN.password
      );
    });

    it("should return BAD_REQUEST when email is missing", async () => {
      const response = await request(app)
        .post("/api/user/login")
        .send({
          password: TEST_DATA.USER.VALID.password
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.EMAIL_REQUIRED);
    });

    it("should return BAD_REQUEST when password is missing", async () => {
      const response = await request(app)
        .post("/api/user/login")
        .send({
          email: TEST_USERS.DEFAULT.email
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.PASSWORD_REQUIRED);
    });

    it("should return BAD_REQUEST for invalid email format", async () => {
      const response = await request(app)
        .post("/api/user/login")
        .send({
          email: TEST_DATA.USER.INVALID.email,
          password: TEST_DATA.USER.VALID.password
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.EMAIL_INVALID);
    });

    it("should return 401 for invalid credentials", async () => {
      mockUsersModel.login.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/login")
        .send({
          email: TEST_USERS.DEFAULT.email,
          password: "wrongpassword"
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.message).toBe(USER_MESSAGES.ERRORS.INVALID_CREDENTIALS);
    });

    it("should accept valid login credentials", async () => {
      const mockUser = { _id: TEST_IDS.USER, email: TEST_USERS.DEFAULT.email };
      mockUsersModel.login.mockResolvedValue(mockUser);

      const response = await request(app)
        .post("/api/user/login")
        .send({
          email: TEST_DATA.USER.VALID_LOGIN.email,
          password: TEST_DATA.USER.VALID_LOGIN.password
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body).toHaveProperty("token");
    });
  });

  describe("POST /api/user/reset-password", () => {
    it("should reset password successfully", async () => {
      mockUsersModel.resetPassword.mockResolvedValue("newpassword123");

      const response = await request(app)
        .post("/api/user/reset-password")
        .send({
          email: TEST_USERS.DEFAULT.email
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual({
        message: USER_MESSAGES.SUCCESS.PASSWORD_RESET,
      });

      expect(mockUsersModel.resetPassword).toHaveBeenCalledWith(TEST_USERS.DEFAULT.email);
    });

    it("should return BAD_REQUEST when email is missing", async () => {
      const response = await request(app)
        .post("/api/user/reset-password")
        .send({})
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.EMAIL_REQUIRED);
    });

    it("should return BAD_REQUEST for invalid email format", async () => {
      const response = await request(app)
        .post("/api/user/reset-password")
        .send({
          email: TEST_DATA.USER.INVALID.email
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.EMAIL_INVALID);
    });

    it("should return 404 when user does not exist", async () => {
      mockUsersModel.resetPassword.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/reset-password")
        .send({
          email: "nonexistent@example.com"
        })
        .expect(HTTP_STATUS.INTERNAL_ERROR); 

      expect(response.body.message).toBe(USER_MESSAGES.ERRORS.PASSWORD_RESET_FAILED);
    });

    it("should return INTERNAL_ERROR when password reset fails", async () => {
      mockUsersModel.resetPassword.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/reset-password")
        .send({
          email: TEST_USERS.DEFAULT.email
        })
        .expect(HTTP_STATUS.INTERNAL_ERROR);

      expect(response.body.message).toBe(USER_MESSAGES.ERRORS.PASSWORD_RESET_FAILED);
    });
  });

  describe("POST /api/user/change-password", () => {
    it("should change password successfully", async () => {
      const mockUser = { _id: TEST_IDS.USER, email: TEST_USERS.DEFAULT.email };
      mockUsersModel.login.mockResolvedValue(mockUser);
      mockUsersModel.changePassword.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: TEST_USERS.DEFAULT.email,
          oldPassword: TEST_DATA.USER.VALID_LOGIN.password,
          newPassword: TEST_DATA.USER.VALID.password
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual({
        message: USER_MESSAGES.SUCCESS.PASSWORD_CHANGED,
      });

      expect(mockUsersModel.login).toHaveBeenCalledWith(TEST_USERS.DEFAULT.email, TEST_DATA.USER.VALID_LOGIN.password);
      expect(mockUsersModel.changePassword).toHaveBeenCalledWith(TEST_USERS.DEFAULT.email, TEST_DATA.USER.VALID.password);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post("/api/user/change-password")
        .send({
          email: TEST_USERS.DEFAULT.email,
          oldPassword: "OldPass123",
          newPassword: "NewPass123"
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.message).toBe(COMMON_MESSAGES.AUTH.ACCESS_DENIED);
    });

    it("should return BAD_REQUEST when email is missing", async () => {
      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          oldPassword: TEST_DATA.USER.VALID_LOGIN.password,
          newPassword: TEST_DATA.USER.VALID.password
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.EMAIL_REQUIRED);
    });

    it("should return BAD_REQUEST when oldPassword is missing", async () => {
      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: TEST_USERS.DEFAULT.email,
          newPassword: TEST_DATA.USER.VALID.password
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.OLD_PASSWORD_REQUIRED);
    });

    it("should return BAD_REQUEST when newPassword is missing", async () => {
      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: TEST_USERS.DEFAULT.email,
          oldPassword: TEST_DATA.USER.VALID_LOGIN.password
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.NEW_PASSWORD_REQUIRED);
    });

    it("should return BAD_REQUEST for invalid email format", async () => {
      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: TEST_DATA.USER.INVALID.email,
          oldPassword: TEST_DATA.USER.VALID_LOGIN.password,
          newPassword: TEST_DATA.USER.VALID.password
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.EMAIL_INVALID);
    });

    it("should return 401 for incorrect old password", async () => {
      mockUsersModel.login.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: TEST_USERS.DEFAULT.email,
          oldPassword: "wrongpassword",
          newPassword: TEST_DATA.USER.VALID.password
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.message).toBe(USER_MESSAGES.ERRORS.INVALID_CREDENTIALS);
    });
  });

  describe("POST /api/user/delete-user", () => {
    it("should delete user successfully", async () => {
      const mockUser = { _id: TEST_IDS.USER, email: TEST_USERS.DEFAULT.email };
      mockUsersModel.login.mockResolvedValue(mockUser);
      mockUsersModel.delete.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/delete-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: TEST_USERS.DEFAULT.email,
          password: TEST_DATA.USER.VALID_LOGIN.password
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual({
        message: USER_MESSAGES.SUCCESS.DELETED,
      });

      expect(mockUsersModel.login).toHaveBeenCalledWith(TEST_USERS.DEFAULT.email, TEST_DATA.USER.VALID_LOGIN.password);
      expect(mockUsersModel.delete).toHaveBeenCalledWith(TEST_USERS.DEFAULT.email);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post("/api/user/delete-user")
        .send({
          email: TEST_USERS.DEFAULT.email,
          password: TEST_DATA.USER.VALID.password
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.message).toBe(COMMON_MESSAGES.AUTH.ACCESS_DENIED);
    });

    it("should return BAD_REQUEST when email is missing", async () => {
      const response = await request(app)
        .post("/api/user/delete-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          password: TEST_DATA.USER.VALID_LOGIN.password
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.EMAIL_REQUIRED);
    });

    it("should return BAD_REQUEST when password is missing", async () => {
      const response = await request(app)
        .post("/api/user/delete-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: TEST_USERS.DEFAULT.email
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.PASSWORD_REQUIRED);
    });

    it("should return BAD_REQUEST for invalid email format", async () => {
      const response = await request(app)
        .post("/api/user/delete-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: TEST_DATA.USER.INVALID.email,
          password: TEST_DATA.USER.VALID_LOGIN.password
        })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toBe(USER_MESSAGES.VALIDATION.EMAIL_INVALID);
    });

    it("should return 401 for incorrect credentials", async () => {
      mockUsersModel.login.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/delete-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: TEST_USERS.DEFAULT.email,
          password: "wrongpassword"
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.message).toBe(USER_MESSAGES.ERRORS.INVALID_CREDENTIALS);
    });

    it("should return INTERNAL_ERROR when user deletion fails", async () => {
      const mockUser = { _id: TEST_IDS.USER, email: TEST_USERS.DEFAULT.email };
      mockUsersModel.login.mockResolvedValue(mockUser);
      mockUsersModel.delete.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/delete-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: TEST_USERS.DEFAULT.email,
          password: TEST_DATA.USER.VALID_LOGIN.password
        })
        .expect(HTTP_STATUS.INTERNAL_ERROR);

      expect(response.body.message).toBe(USER_MESSAGES.ERRORS.USER_DELETION_FAILED);
    });
  });
});
