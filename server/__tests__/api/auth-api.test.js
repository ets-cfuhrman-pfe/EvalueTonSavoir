const request = require("supertest");
const express = require("express");
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

// Import the actual components
const authController = require("../../controllers/auth");
const errorHandler = require("../../middleware/errorHandler");
const asyncHandler = require("../../routers/routerUtils");

// Mock the AuthConfig
jest.mock("../../config/auth.js", () => {
  return jest.fn().mockImplementation(() => ({
    loadConfig: jest.fn(),
    getActiveAuth: jest.fn(),
    getRoomsRequireAuth: jest.fn(),
  }));
});

const AuthConfig = require("../../config/auth.js");

// Create test app with manual routing
const createTestApp = () => {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Define routes
  app.get("/api/auth/getActiveAuth", asyncHandler(authController.getActive));
  app.get("/api/auth/getRoomsRequireAuth", asyncHandler(authController.getRoomsRequireAuth));

  // Add error handler
  app.use(errorHandler);

  return app;
};

describe("Auth API Integration Tests", () => {
  let app;
  let mockAuthConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mock instance for each test
    mockAuthConfig = {
      loadConfig: jest.fn().mockImplementation(function() { this.config = { auth: { simpleauth: { enabled: true, name: "provider3" } } } }),
      getActiveAuth: jest.fn(),
      getRoomsRequireAuth: jest.fn(),
    };

    // Reset the AuthConfig mock
    AuthConfig.mockClear();
    AuthConfig.mockImplementation(() => mockAuthConfig);

    app = createTestApp();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/auth/getActiveAuth", () => {
    it("should return active auth configuration successfully", async () => {
      const mockAuthData = {
        google: {
          type: "oauth"
        },
        simpleauth: {
          type: "simpleauth",
          name: "Simple Login"
        }
      };

      mockAuthConfig.getActiveAuth.mockReturnValue(mockAuthData);

      const response = await request(app)
        .get("/api/auth/getActiveAuth")
        .expect(200);

      expect(response.headers['content-type']).toBe("application/json; charset=utf-8");
      expect(response.body).toEqual({
        authActive: mockAuthData
      });

      expect(mockAuthConfig.loadConfig).toHaveBeenCalled();
      expect(mockAuthConfig.getActiveAuth).toHaveBeenCalled();
    });

    it("should handle configuration loading error", async () => {
      mockAuthConfig.loadConfig.mockImplementation(() => {
        throw new Error("Configuration loading failed");
      });

      const response = await request(app)
        .get("/api/auth/getActiveAuth")
        .expect(500);
      expect(response.statusCode).toBe(500);

    });

    it("should handle getActiveAuth error", async () => {
      mockAuthConfig.getActiveAuth.mockImplementation(() => {
        throw new Error("GetActiveAuth failed");
      });

      const response = await request(app)
        .get("/api/auth/getActiveAuth")
        .expect(500);

      expect(response.statusCode).toBe(500);
    });

    it("should return error when no auth configuration available", async () => {
      const mockErrorResponse = { error: "Aucune configuration d'authentification disponible." };
      mockAuthConfig.getActiveAuth.mockReturnValue(mockErrorResponse);

      const response = await request(app)
        .get("/api/auth/getActiveAuth")
        .expect(200);

      expect(response.headers['content-type']).toBe("application/json; charset=utf-8");
      expect(response.body).toEqual({
        authActive: mockErrorResponse
      });
    });
  });

  describe("GET /api/auth/getRoomsRequireAuth", () => {
    it("should return rooms require auth setting successfully", async () => {
      mockAuthConfig.getRoomsRequireAuth.mockReturnValue(true);

      const response = await request(app)
        .get("/api/auth/getRoomsRequireAuth")
        .expect(200);
      expect(response.headers['content-type']).toBe("application/json; charset=utf-8");
      expect(response.body).toEqual({
        roomsRequireAuth: true
      });

      expect(mockAuthConfig.getRoomsRequireAuth).toHaveBeenCalled();
    });

    it("should return false when rooms do not require auth", async () => {
      mockAuthConfig.getRoomsRequireAuth.mockReturnValue(false);

      const response = await request(app)
        .get("/api/auth/getRoomsRequireAuth")
        .expect(200);

      expect(response.headers['content-type']).toBe("application/json; charset=utf-8");
      expect(response.body).toEqual({
        roomsRequireAuth: false
      });

      expect(mockAuthConfig.getRoomsRequireAuth).toHaveBeenCalled();
    });

    it("should handle getRoomsRequireAuth error", async () => {
      mockAuthConfig.getRoomsRequireAuth.mockImplementation(() => {
        throw new Error("Configuration error");
      });

      const response = await request(app)
        .get("/api/auth/getRoomsRequireAuth")
        .expect(500);

      expect(response.statusCode).toBe(500);
    });
  });
});
