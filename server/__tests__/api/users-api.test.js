const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

// Import the actual components
const UsersController = require("../../controllers/users");
const jwtMiddleware = require("../../middleware/jwtToken");
const errorHandler = require("../../middleware/errorHandler");
const {
  validateUserRegistration,
  validateUserLogin,
  validateEmailOnly,
  validatePasswordChange
} = require("../../middleware/validation");
const asyncHandler = require("../../routers/routerUtils");

// Mock the database model
const mockUsersModel = {
  register: jest.fn(),
  login: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
  delete: jest.fn(),
};

// Mock emailer
jest.mock("../../config/email.js", () => ({
  registerConfirmation: jest.fn(),
  newPasswordConfirmation: jest.fn(),
}));

// Create test app with manual routing
const createTestApp = () => {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

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

  return app;
};

describe("Users API Integration Tests", () => {
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

  describe("POST /api/user/register", () => {
    it("should register a user successfully", async () => {
      mockUsersModel.register.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "newuser@example.com",
          password: "ValidPass123",
          username: "newuser"
        })
        .expect(200);

      expect(response.body).toEqual({
        message: "Utilisateur créé avec succès.",
      });

      expect(mockUsersModel.register).toHaveBeenCalledWith(
        "newuser@example.com",
        "ValidPass123"
      );
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({
          password: "ValidPass123",
          username: "newuser"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Email requis");
    });


    it("should return 400 when username is missing", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "newuser@example.com",
          password: "ValidPass123"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Nom d'utilisateur requis");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "invalid-email",
          password: "ValidPass123",
          username: "newuser"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: L'adresse email doit être valide");
    });


    it("should return 400 for username too short", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "newuser@example.com",
          password: "ValidPass123",
          username: "a"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Le nom d'utilisateur ne peut contenir que des lettres et des chiffres");
    });

    it("should return 400 for username with invalid characters", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "newuser@example.com",
          password: "ValidPass123",
          username: "user-name"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Le nom d'utilisateur ne peut contenir que des lettres et des chiffres");
    });

    it("should return 400 for email too long", async () => {
      const longEmail = "a".repeat(62) + "@example.com"; // 64 chars total
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: longEmail,
          password: "ValidPass123",
          username: "newuser"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: L'adresse email doit être valide");
    });

    it("should return 400 for username too long", async () => {
      const longUsername = "a".repeat(26); // 26 chars
      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "newuser@example.com",
          password: "ValidPass123",
          username: longUsername
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Le nom d'utilisateur ne peut contenir que des lettres et des chiffres");
    });

    it("should accept valid registration data", async () => {
      mockUsersModel.register.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "valid@example.com",
          password: "ValidPass123",
          username: "validuser"
        })
        .expect(200);

      expect(response.body.message).toBe("Utilisateur créé avec succès.");
    });

    it("should handle minimum valid lengths", async () => {
      mockUsersModel.register.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: "ab@c.de", // minimum email
          password: "Valid123", // minimum password with uppercase, lowercase, number
          username: "ab" // minimum username
        })
        .expect(200);

      expect(response.body.message).toBe("Utilisateur créé avec succès.");
    });

    it("should handle maximum valid lengths", async () => {
      mockUsersModel.register.mockResolvedValue(true);

      const maxEmail = "a".repeat(59) + "@b.co"; // 64 chars total
      const maxPassword = "ValidP1" + "a".repeat(56); // 64 chars, meets pattern
      const maxUsername = "a".repeat(25); // 25 chars

      const response = await request(app)
        .post("/api/user/register")
        .send({
          email: maxEmail,
          password: maxPassword,
          username: maxUsername
        })
        .expect(200);

      expect(response.body.message).toBe("Utilisateur créé avec succès.");
    });
  });

  describe("POST /api/user/login", () => {
    it("should login user successfully", async () => {
      const mockUser = { _id: "user123", email: "test@example.com" };
      mockUsersModel.login.mockResolvedValue(mockUser);

      const response = await request(app)
        .post("/api/user/login")
        .send({
          email: "test@example.com",
          password: "ValidPass123"
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(mockUsersModel.login).toHaveBeenCalledWith(
        "test@example.com",
        "ValidPass123"
      );
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/api/user/login")
        .send({
          password: "ValidPass123"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Email requis");
    });

    it("should return 400 when password is missing", async () => {
      const response = await request(app)
        .post("/api/user/login")
        .send({
          email: "test@example.com"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Mot de passe requis");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/user/login")
        .send({
          email: "invalid-email",
          password: "ValidPass123"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: L'adresse email doit être valide");
    });

    it("should return 401 for invalid credentials", async () => {
      mockUsersModel.login.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword"
        })
        .expect(401);

      expect(response.body.message).toBe("L'email et le mot de passe ne correspondent pas.");
    });

    it("should accept valid login credentials", async () => {
      const mockUser = { _id: "user123", email: "test@example.com" };
      mockUsersModel.login.mockResolvedValue(mockUser);

      const response = await request(app)
        .post("/api/user/login")
        .send({
          email: "test@example.com",
          password: "ValidPass123"
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
    });
  });

  describe("POST /api/user/reset-password", () => {
    it("should reset password successfully", async () => {
      mockUsersModel.resetPassword.mockResolvedValue("newpassword123");

      const response = await request(app)
        .post("/api/user/reset-password")
        .send({
          email: "test@example.com"
        })
        .expect(200);

      expect(response.body).toEqual({
        message: "Nouveau mot de passe envoyé par courriel.",
      });

      expect(mockUsersModel.resetPassword).toHaveBeenCalledWith("test@example.com");
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/api/user/reset-password")
        .send({})
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Email requis");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/user/reset-password")
        .send({
          email: "invalid-email"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: L'adresse email doit être valide");
    });

    it("should return 500 when password reset fails", async () => {
      mockUsersModel.resetPassword.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/reset-password")
        .send({
          email: "test@example.com"
        })
        .expect(500);

      expect(response.body.message).toBe("Une erreur s'est produite lors de la création d'un nouveau mot de passe.");
    });
  });

  describe("POST /api/user/change-password", () => {
    it("should change password successfully", async () => {
      const mockUser = { _id: "user123", email: "test@example.com" };
      mockUsersModel.login.mockResolvedValue(mockUser);
      mockUsersModel.changePassword.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "test@example.com",
          oldPassword: "OldPass123",
          newPassword: "NewPass123"
        })
        .expect(200);

      expect(response.body).toEqual({
        message: "Mot de passe changé avec succès.",
      });

      expect(mockUsersModel.login).toHaveBeenCalledWith("test@example.com", "OldPass123");
      expect(mockUsersModel.changePassword).toHaveBeenCalledWith("test@example.com", "NewPass123");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post("/api/user/change-password")
        .send({
          email: "test@example.com",
          oldPassword: "OldPass123",
          newPassword: "NewPass123"
        })
        .expect(401);

      expect(response.body.message).toBe("Accès refusé. Aucun jeton fourni.");
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          oldPassword: "OldPass123",
          newPassword: "NewPass123"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Email requis");
    });

    it("should return 400 when oldPassword is missing", async () => {
      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "test@example.com",
          newPassword: "NewPass123"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Ancien mot de passe requis");
    });

    it("should return 400 when newPassword is missing", async () => {
      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "test@example.com",
          oldPassword: "OldPass123"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Nouveau mot de passe requis");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "invalid-email",
          oldPassword: "OldPass123",
          newPassword: "NewPass123"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: L'adresse email doit être valide");
    });

    it("should return 401 for incorrect old password", async () => {
      mockUsersModel.login.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "test@example.com",
          oldPassword: "WrongOldPass",
          newPassword: "NewPass123"
        })
        .expect(401);

      expect(response.body.message).toBe("L'email et le mot de passe ne correspondent pas.");
    });

    it("should return 500 when password change fails", async () => {
      const mockUser = { _id: "user123", email: "test@example.com" };
      mockUsersModel.login.mockResolvedValue(mockUser);
      mockUsersModel.changePassword.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "test@example.com",
          oldPassword: "OldPass123",
          newPassword: "NewPass123"
        })
        .expect(500);

      expect(response.body.message).toBe("Une erreur s'est produite lors de la mise à jours du mot de passe.");
    });
  });

  describe("POST /api/user/delete-user", () => {
    it("should delete user successfully", async () => {
      const mockUser = { _id: "user123", email: "test@example.com" };
      mockUsersModel.login.mockResolvedValue(mockUser);
      mockUsersModel.delete.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/delete-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "test@example.com",
          password: "ValidPass123"
        })
        .expect(200);

      expect(response.body).toEqual({
        message: "Utilisateur supprimé avec succès",
      });

      expect(mockUsersModel.login).toHaveBeenCalledWith("test@example.com", "ValidPass123");
      expect(mockUsersModel.delete).toHaveBeenCalledWith("test@example.com");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post("/api/user/delete-user")
        .send({
          email: "test@example.com",
          password: "ValidPass123"
        })
        .expect(401);

      expect(response.body.message).toBe("Accès refusé. Aucun jeton fourni.");
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/api/user/delete-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          password: "ValidPass123"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Email requis");
    });

    it("should return 400 when password is missing", async () => {
      const response = await request(app)
        .post("/api/user/delete-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "test@example.com"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: Mot de passe requis");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/user/delete-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "invalid-email",
          password: "ValidPass123"
        })
        .expect(400);

      expect(response.body.message).toBe("Données invalides: L'adresse email doit être valide");
    });

    it("should return 401 for incorrect credentials", async () => {
      mockUsersModel.login.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/delete-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "test@example.com",
          password: "WrongPass123"
        })
        .expect(401);

      expect(response.body.message).toBe("L'email et le mot de passe ne correspondent pas.");
    });

    it("should return 500 when user deletion fails", async () => {
      const mockUser = { _id: "user123", email: "test@example.com" };
      mockUsersModel.login.mockResolvedValue(mockUser);
      mockUsersModel.delete.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/delete-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "test@example.com",
          password: "ValidPass123"
        })
        .expect(500);

      expect(response.body.message).toBe("Une erreur s'est produite lors de suppression de l'utilisateur.");
    });
  });
});
