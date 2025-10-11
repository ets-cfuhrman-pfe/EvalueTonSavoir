const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const multer = require("multer");

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

// Import the actual components
const ImagesController = require("../../controllers/images");
const jwtMiddleware = require("../../middleware/jwtToken");
const errorHandler = require("../../middleware/errorHandler");
const asyncHandler = require("../../routers/routerUtils");

// Mock the database model
const mockImagesModel = {
  upload: jest.fn(),
  get: jest.fn(),
  getImages: jest.fn(),
  getUserImages: jest.fn(),
  delete: jest.fn(),
};

// Create test app with manual routing
const createTestApp = () => {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

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
  const imagesController = new ImagesController(mockImagesModel);

  // Set up multer for file uploads
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });

  // Define routes
  app.post(
    "/api/image/upload",
    jwtMiddleware.authenticate,
    upload.single('image'),
    asyncHandler(imagesController.upload)
  );
  app.get(
    "/api/image/get/:id",
    asyncHandler(imagesController.get)
  );
  app.get(
    "/api/image/getImages",
    asyncHandler(imagesController.getImages)
  );
  app.get(
    "/api/image/getUserImages",
    jwtMiddleware.authenticate,
    asyncHandler(imagesController.getUserImages)
  );
  app.delete(
    "/api/image/delete",
    jwtMiddleware.authenticate,
    asyncHandler(imagesController.delete)
  );

  // Add error handler
  app.use(errorHandler);

  return app;
};

describe("Images API Integration Tests", () => {
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

  describe("POST /api/image/upload", () => {
    it("should upload an image successfully", async () => {
      const mockFile = {
        originalname: "test-image.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake-image-data"),
        size: 1024
      };

      mockImagesModel.upload.mockResolvedValue("image123");

      const response = await request(app)
        .post("/api/image/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach('image', mockFile.buffer, 'test-image.jpg')
        .expect(200);

      expect(response.body).toEqual({
        id: "image123",
      });

      expect(mockImagesModel.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldname: 'image',
          originalname: "test-image.jpg",
          mimetype: "image/jpeg",
          buffer: expect.any(Buffer),
          size: expect.any(Number)
        }),
        "user123"
      );

      // Verify logging
      expect(logger.logDatabaseOperation).toHaveBeenCalledWith(
        'insert',
        'images',
        expect.any(Number),
        true,
        expect.objectContaining({
          imageId: 'image123',
          fileName: 'test-image.jpg',
          fileSize: expect.any(Number),
          mimeType: 'image/jpeg'
        })
      );

      expect(logger.logUserAction).toHaveBeenCalledWith(
        'user123',
        'test@example.com',
        'image_uploaded',
        expect.objectContaining({
          imageId: 'image123',
          fileName: 'test-image.jpg',
          fileSize: '0.01KB',
          mimeType: 'image/jpeg',
          uploadTime: expect.stringMatching(/^\d+ms$/)
        })
      );
    });

    it("should return 401 when not authenticated", async () => {
      const mockFile = {
        originalname: "test-image.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake-image-data"),
        size: 1024
      };

      const response = await request(app)
        .post("/api/image/upload")
        .attach('image', mockFile.buffer, 'test-image.jpg')
        .expect(401);

      expect(response.body.message).toBe("Accès refusé. Aucun jeton fourni.");
    });

    it("should return 400 when no file is provided", async () => {
      const response = await request(app)
        .post("/api/image/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toBe("Paramètre requis manquant.");
    });

    it("should handle upload failure", async () => {
      const mockFile = {
        originalname: "test-image.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake-image-data"),
        size: 1024
      };

      mockImagesModel.upload.mockRejectedValue(new Error("Upload failed"));

      const response = await request(app)
        .post("/api/image/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach('image', mockFile.buffer, 'test-image.jpg')
        .expect(500);

      expect(response.statusCode).toBe(500);
    });
  });

  describe("GET /api/image/get/:id", () => {
    it("should return an image successfully", async () => {
      const mockImage = {
        file_name: "test-image.jpg",
        mime_type: "image/jpeg",
        file_content: Buffer.from("fake-image-data")
      };

      mockImagesModel.get.mockResolvedValue(mockImage);

      const response = await request(app)
        .get("/api/image/get/image123")
        .expect(200);

      expect(response.headers['content-type']).toBe("image/jpeg");
      expect(response.headers['content-disposition']).toBe("inline; filename=test-image.jpg");
      expect(response.headers['accept-ranges']).toBe("bytes");
      expect(response.headers['cache-control']).toBe("no-cache, no-store, must-revalidate");
      expect(response.body).toEqual(Buffer.from("fake-image-data"));

      expect(mockImagesModel.get).toHaveBeenCalledWith("image123");

      // Verify logging
      expect(logger.logDatabaseOperation).toHaveBeenCalledWith(
        'select',
        'images',
        expect.any(Number),
        true,
        expect.objectContaining({
          imageId: 'image123',
          fileSize: 15, // "fake-image-data".length
          mimeType: 'image/jpeg'
        })
      );

      expect(logger.warn).toHaveBeenCalledWith(
        'Action attempted without authentication: image_accessed',
        expect.objectContaining({
          imageId: 'image123',
          fileName: 'test-image.jpg',
          fileSize: '0.01KB', // formatted size
          mimeType: 'image/jpeg',
          retrievalTime: expect.stringMatching(/^\d+ms$/)
        })
      );
    });

    it("should return 400 when id is missing", async () => {
      await request(app)
        .get("/api/image/get/")
        .expect(404);
    });

    it("should return 404 when image not found", async () => {
      mockImagesModel.get.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/image/get/image123")
        .expect(404);

      expect(response.body.message).toBe("Nous n'avons pas trouvé l'image.");
    });

    it("should handle get failure", async () => {
      mockImagesModel.get.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/api/image/get/image123")
        .expect(500);

      expect(response.statusCode).toBe(500);
    });
  });

  describe("GET /api/image/getImages", () => {
    it("should return images successfully with default pagination", async () => {
      const mockImages = [
        { id: "image1", file_name: "image1.jpg" },
        { id: "image2", file_name: "image2.jpg" }
      ];

      mockImagesModel.getImages.mockResolvedValue(mockImages);

      const response = await request(app)
        .get("/api/image/getImages")
        .expect(200);

      expect(response.headers['content-type']).toBe("application/json; charset=utf-8");
      expect(response.body).toEqual(mockImages);

      expect(mockImagesModel.getImages).toHaveBeenCalledWith(1, 5);
    });

    it("should return images with custom pagination", async () => {
      const mockImages = [
        { id: "image3", file_name: "image3.jpg" }
      ];

      mockImagesModel.getImages.mockResolvedValue(mockImages);

      const response = await request(app)
        .get("/api/image/getImages?page=2&limit=10")
        .expect(200);

      expect(response.body).toEqual(mockImages);

      expect(mockImagesModel.getImages).toHaveBeenCalledWith(2, 10);
    });

    it("should return 404 when no images found", async () => {
      mockImagesModel.getImages.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/image/getImages")
        .expect(404);

      expect(response.body.message).toBe("Nous n'avons pas trouvé l'image.");
    });

    it("should handle getImages failure", async () => {
      mockImagesModel.getImages.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/api/image/getImages")
        .expect(500);
      
      expect(response.statusCode).toBe(500);
    });
  });

  describe("GET /api/image/getUserImages", () => {
    it("should return user images successfully", async () => {
      const mockImages = [
        { id: "image1", file_name: "user-image1.jpg" },
        { id: "image2", file_name: "user-image2.jpg" }
      ];

      mockImagesModel.getUserImages.mockResolvedValue(mockImages);

      const response = await request(app)
        .get("/api/image/getUserImages?uid=user123")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe("application/json; charset=utf-8");
      expect(response.body).toEqual(mockImages);

      expect(mockImagesModel.getUserImages).toHaveBeenCalledWith(1, 5, "user123");
    });

    it("should return user images with custom pagination", async () => {
      const mockImages = [
        { id: "image3", file_name: "user-image3.jpg" }
      ];

      mockImagesModel.getUserImages.mockResolvedValue(mockImages);

      const response = await request(app)
        .get("/api/image/getUserImages?page=3&limit=20&uid=user456")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual(mockImages);

      expect(mockImagesModel.getUserImages).toHaveBeenCalledWith(3, 20, "user456");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .get("/api/image/getUserImages?uid=user123")
        .expect(401);

      expect(response.body.message).toBe("Accès refusé. Aucun jeton fourni.");
    });

    it("should return 404 when no user images found", async () => {
      mockImagesModel.getUserImages.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/image/getUserImages?uid=user123")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe("Nous n'avons pas trouvé l'image.");
    });

    it("should handle getUserImages failure", async () => {
      mockImagesModel.getUserImages.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/api/image/getUserImages?uid=user123")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.statusCode).toBe(500);
    });
  });

  describe("DELETE /api/image/delete", () => {
    it("should delete an image successfully", async () => {
      const mockResult = { deleted: true };

      mockImagesModel.delete.mockResolvedValue(mockResult);

      const response = await request(app)
        .delete("/api/image/delete?uid=user123&imgId=image456")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe("application/json; charset=utf-8");
      expect(response.body).toEqual(mockResult);

      expect(mockImagesModel.delete).toHaveBeenCalledWith("user123", "image456");

      // Verify logging
      expect(logger.logDatabaseOperation).toHaveBeenCalledWith(
        'delete',
        'images',
        expect.any(Number),
        true,
        expect.objectContaining({
          imageId: 'image456',
          targetUserId: 'user123'
        })
      );

      expect(logger.logUserAction).toHaveBeenCalledWith(
        'user123',
        'test@example.com',
        'image_deleted',
        expect.objectContaining({
          imageId: 'image456',
          targetUserId: 'user123',
          deleteTime: expect.stringMatching(/^\d+ms$/)
        })
      );
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .delete("/api/image/delete?uid=user123&imgId=image456")
        .expect(401);

      expect(response.body.message).toBe("Accès refusé. Aucun jeton fourni.");
    });

    it("should return 400 when uid is missing", async () => {
      const response = await request(app)
        .delete("/api/image/delete?imgId=image456")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toBe("Paramètre requis manquant.");
    });

    it("should return 400 when imgId is missing", async () => {
      const response = await request(app)
        .delete("/api/image/delete?uid=user123")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toBe("Paramètre requis manquant.");
    });

    it("should handle delete failure", async () => {
      mockImagesModel.delete.mockRejectedValue(new Error("Delete failed"));

      const response = await request(app)
        .delete("/api/image/delete?uid=user123&imgId=image456")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);
      
      expect(response.statusCode).toBe(500);
    });
  });
});
