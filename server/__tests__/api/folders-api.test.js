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

// Import the actual components
const FoldersController = require("../../controllers/folders");
const jwtMiddleware = require("../../middleware/jwtToken");
const errorHandler = require("../../middleware/errorHandler");
const { validateFolderCreation, validateFolderRename, validateFolderCopy } = require("../../middleware/validation");
const asyncHandler = require("../../routers/routerUtils");

// Mock the database model
const mockFoldersModel = {
    create: jest.fn(),
    getUserFolders: jest.fn(),
    getContent: jest.fn(),
    getOwner: jest.fn(),
    delete: jest.fn(),
    rename: jest.fn(),
    getFolderById: jest.fn(),
    folderExists: jest.fn(),
    duplicate: jest.fn(),
    copy: jest.fn(),
};

// Create test app with manual routing 
const createTestApp = () => {
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Create controller instance with mock model
    const foldersController = new FoldersController(mockFoldersModel);

    // Define routes with validation middleware
    app.post(
        "/api/folder/create",
        jwtMiddleware.authenticate,
        validateFolderCreation,
        asyncHandler(foldersController.create)
    );
    app.get(
        "/api/folder/getUserFolders",
        jwtMiddleware.authenticate,
        asyncHandler(foldersController.getUserFolders)
    );
    app.get(
        "/api/folder/getFolderContent/:folderId",
        jwtMiddleware.authenticate,
        asyncHandler(foldersController.getFolderContent)
    );
    app.delete(
        "/api/folder/delete/:folderId",
        jwtMiddleware.authenticate,
        asyncHandler(foldersController.delete)
    );
    app.put(
        "/api/folder/rename",
        jwtMiddleware.authenticate,
        validateFolderRename,
        asyncHandler(foldersController.rename)
    );
    app.post(
        "/api/folder/duplicate",
        jwtMiddleware.authenticate,
        asyncHandler(foldersController.duplicate)
    );
    app.post(
        "/api/folder/copy/:folderId",
        jwtMiddleware.authenticate,
        validateFolderCopy,
        asyncHandler(foldersController.copy)
    );
    app.get(
        "/api/folder/getFolderById/:folderId",
        jwtMiddleware.authenticate,
        asyncHandler(foldersController.getFolderById)
    );
    app.post(
        "/api/folder/folderExists",
        jwtMiddleware.authenticate,
        asyncHandler(foldersController.folderExists)
    );

    // Add error handler
    app.use(errorHandler);

    return app;
};

describe("Folders API Integration Tests", () => {
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

    describe("POST /api/folder/create", () => {
        it("should create a folder successfully", async () => {
            mockFoldersModel.create.mockResolvedValue("folder123");

            const response = await request(app)
                .post("/api/folder/create")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: "Test Folder" })
                .expect(200);

            expect(response.body).toEqual({
                message: "Dossier créé avec succès.",
            });

            expect(mockFoldersModel.create).toHaveBeenCalledWith(
                "Test Folder",
                "user123"
            );
        });

        it("should return 401 when no auth token provided", async () => {
            const response = await request(app)
                .post("/api/folder/create")
                .send({ title: "Test Folder" })
                .expect(401);

            expect(response.body.message).toBe("Accès refusé. Aucun jeton fourni.");
        });

        it("should return 401 with invalid token", async () => {
            const response = await request(app)
                .post("/api/folder/create")
                .set("Authorization", "Bearer invalid-token")
                .send({ title: "Test Folder" })
                .expect(401);

            expect(response.body.message).toBe("Accès refusé. Jeton invalide.");
        });

        it("should return 409 when folder already exists", async () => {
            mockFoldersModel.create.mockResolvedValue(null); // Model returns null when folder exists

            const response = await request(app)
                .post("/api/folder/create")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: "Existing Folder" })
                .expect(409);

            expect(response.body.message).toBe("Le dossier existe déjà.");
        });

        // Input validation tests 
        it("should return 400 when title is missing", async () => {
            const response = await request(app)
                .post("/api/folder/create")
                .set("Authorization", `Bearer ${authToken}`)
                .send({})
                .expect(400);

            expect(response.body.message).toBe("Données invalides: Titre requis");
        });

        it("should return 400 for empty title", async () => {
            const response = await request(app)
                .post("/api/folder/create")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: "" })
                .expect(400);

            expect(response.body.message).toBe("Données invalides: Titre requis");
        });

        it("should return 400 for title with only spaces", async () => {
            const response = await request(app)
                .post("/api/folder/create")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: "   " })
                .expect(400);

            expect(response.body.message).toBe("Données invalides: Le titre ne peut contenir que des lettres, chiffres, espaces, tirets et underscores");
        });

        it("should return 400 for title that is too long", async () => {
            const longTitle = "A".repeat(65); // maxLength is 64
            const response = await request(app)
                .post("/api/folder/create")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: longTitle })
                .expect(400);

            expect(response.body.message).toBe("Données invalides: Le titre ne peut contenir que des lettres, chiffres, espaces, tirets et underscores");
        });

        it("should return 400 for title with invalid characters", async () => {
            const response = await request(app)
                .post("/api/folder/create")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: 'Folder<script>alert("xss")</script>' })
                .expect(400);

            expect(response.body.message).toBe("Données invalides: Le titre ne peut contenir que des lettres, chiffres, espaces, tirets et underscores");
        });

        it("should reject SQL injection attempts", async () => {
            const response = await request(app)
                .post("/api/folder/create")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: "'; DROP TABLE folders; --" })
                .expect(400);

            expect(response.body.message).toBe("Données invalides: Le titre ne peut contenir que des lettres, chiffres, espaces, tirets et underscores");
        });

        it("should accept valid title with mixed characters", async () => {
            mockFoldersModel.create.mockResolvedValue("folder123");

            const response = await request(app)
                .post("/api/folder/create")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: "Valid Folder Name 123" })
                .expect(200);

            expect(response.body.message).toBe("Dossier créé avec succès.");
        });
    });

    describe("GET /api/folder/getUserFolders", () => {
        it("should return user folders successfully", async () => {
            const mockFolders = [
                { _id: "folder1", title: "Folder 1", userId: "user123" },
                { _id: "folder2", title: "Folder 2", userId: "user123" },
            ];
            mockFoldersModel.getUserFolders.mockResolvedValue(mockFolders);

            const response = await request(app)
                .get("/api/folder/getUserFolders")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual({
                data: mockFolders,
            });

            expect(mockFoldersModel.getUserFolders).toHaveBeenCalledWith("user123");
        });

        it("should return 404 when no folders found", async () => {
            mockFoldersModel.getUserFolders.mockResolvedValue(null);

            const response = await request(app)
                .get("/api/folder/getUserFolders")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.message).toBe(
                "Aucun dossier portant cet identifiant n'a été trouvé."
            );
        });

        it("should return 401 when not authenticated", async () => {
            const response = await request(app)
                .get("/api/folder/getUserFolders")
                .expect(401);

            expect(response.body.message).toBe("Accès refusé. Aucun jeton fourni.");
        });
    });

    describe("GET /api/folder/getFolderContent/:folderId", () => {
        it("should return folder content successfully", async () => {
            const folderId = "folder123";
            const mockContent = [
                { _id: "quiz1", title: "Quiz 1", folderId },
                { _id: "quiz2", title: "Quiz 2", folderId },
            ];
            mockFoldersModel.getOwner.mockResolvedValue("user123");
            mockFoldersModel.getContent.mockResolvedValue(mockContent);

            const response = await request(app)
                .get(`/api/folder/getFolderContent/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual({
                data: mockContent,
            });

            expect(mockFoldersModel.getOwner).toHaveBeenCalledWith(folderId);
            expect(mockFoldersModel.getContent).toHaveBeenCalledWith(folderId);
        });

        it("should return 404 when user is not the owner", async () => {
            const folderId = "folder123";
            mockFoldersModel.getOwner.mockResolvedValue("otherUser");

            const response = await request(app)
                .get(`/api/folder/getFolderContent/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.message).toBe(
                "Aucun dossier portant cet identifiant n'a été trouvé."
            );
        });

        it("should return 500 when content not found", async () => {
            const folderId = "folder123";
            mockFoldersModel.getOwner.mockResolvedValue("user123");
            mockFoldersModel.getContent.mockResolvedValue(null);

            const response = await request(app)
                .get(`/api/folder/getFolderContent/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(500);

            expect(response.body.message).toBe(
                "Une erreur s'est produite lors de la récupération du dossier."
            );
        });
    });

    describe("DELETE /api/folder/delete/:folderId", () => {
        it("should delete folder successfully", async () => {
            const folderId = "folder123";
            mockFoldersModel.getOwner.mockResolvedValue("user123");
            mockFoldersModel.delete.mockResolvedValue(true);

            const response = await request(app)
                .delete(`/api/folder/delete/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual({
                message: "Dossier supprimé avec succès.",
            });

            expect(mockFoldersModel.getOwner).toHaveBeenCalledWith(folderId);
            expect(mockFoldersModel.delete).toHaveBeenCalledWith(folderId);
        });

        it("should return 404 when user is not the owner", async () => {
            const folderId = "folder123";
            mockFoldersModel.getOwner.mockResolvedValue("otherUser");

            const response = await request(app)
                .delete(`/api/folder/delete/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.message).toBe(
                "Aucun dossier portant cet identifiant n'a été trouvé."
            );
        });

        it("should return 500 when delete fails", async () => {
            const folderId = "folder123";
            mockFoldersModel.getOwner.mockResolvedValue("user123");
            mockFoldersModel.delete.mockResolvedValue(false);

            const response = await request(app)
                .delete(`/api/folder/delete/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(500);

            expect(response.body.message).toBe(
                "Une erreur s'est produite lors de la suppression du dossier."
            );
        });
    });

    describe("PUT /api/folder/rename", () => {
        it("should rename folder successfully", async () => {
            const folderId = "folder123";
            const newTitle = "New Folder Title";
            mockFoldersModel.getOwner.mockResolvedValue("user123");
            mockFoldersModel.folderExists.mockResolvedValue(false);
            mockFoldersModel.rename.mockResolvedValue(true);

            const response = await request(app)
                .put("/api/folder/rename")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId, newTitle })
                .expect(200);

            expect(response.body).toEqual({
                message: "Dossier mis à jours avec succès.",
            });

            expect(mockFoldersModel.getOwner).toHaveBeenCalledWith(folderId);
            expect(mockFoldersModel.folderExists).toHaveBeenCalledWith(
                newTitle,
                "user123"
            );
            expect(mockFoldersModel.rename).toHaveBeenCalledWith(
                folderId,
                "user123",
                newTitle
            );
        });

        it("should return 409 when new title already exists", async () => {
            const folderId = "folder123";
            const newTitle = "Existing Title";
            mockFoldersModel.getOwner.mockResolvedValue("user123");
            mockFoldersModel.folderExists.mockResolvedValue(true);

            const response = await request(app)
                .put("/api/folder/rename")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId, newTitle })
                .expect(409);

            expect(response.body.message).toBe("Le dossier existe déjà.");
        });

        // Input validation tests (these will fail until validation is implemented)
        it("should return 400 when folderId is missing", async () => {
            const response = await request(app)
                .put("/api/folder/rename")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ newTitle: "New Title" })
                .expect(400);

            expect(response.body.message).toBe("Données invalides: ID du dossier requis");
        });

        it("should return 400 when newTitle is missing", async () => {
            const response = await request(app)
                .put("/api/folder/rename")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId: "folder123" })
                .expect(400);

            expect(response.body.message).toBe("Données invalides: Nouveau titre requis");
        });

        it("should return 400 for empty newTitle", async () => {
            const response = await request(app)
                .put("/api/folder/rename")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId: "folder123", newTitle: "" })
                .expect(400);

            expect(response.body.message).toBe("Données invalides: Nouveau titre requis");
        });

        it("should return 400 for newTitle with only spaces", async () => {
            const response = await request(app)
                .put("/api/folder/rename")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId: "folder123", newTitle: "   " })
                .expect(400);

            expect(response.body.message).toBe("Données invalides: Le titre ne peut contenir que des lettres, chiffres, espaces, tirets et underscores");
        });

        it("should return 400 for newTitle that is too long", async () => {
            const longTitle = "A".repeat(65); // maxLength is 64
            const response = await request(app)
                .put("/api/folder/rename")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId: "folder123", newTitle: longTitle })
                .expect(400);

            expect(response.body.message).toBe("Données invalides: Le titre ne peut contenir que des lettres, chiffres, espaces, tirets et underscores");
        });

        it("should accept valid newTitle", async () => {
            mockFoldersModel.getOwner.mockResolvedValue("user123");
            mockFoldersModel.folderExists.mockResolvedValue(false);
            mockFoldersModel.rename.mockResolvedValue(true);

            const response = await request(app)
                .put("/api/folder/rename")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId: "folder123", newTitle: "Valid New Name" })
                .expect(200);

            expect(response.body.message).toContain("mis à jours avec succès");
        });
    });

    describe("POST /api/folder/duplicate", () => {
        it("should duplicate folder successfully", async () => {
            const folderId = "folder123";
            const newFolderId = "folder456";
            mockFoldersModel.getOwner.mockResolvedValue("user123");
            mockFoldersModel.duplicate.mockResolvedValue(newFolderId);

            const response = await request(app)
                .post("/api/folder/duplicate")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId })
                .expect(200);

            expect(response.body).toEqual({
                message: "Dossier dupliqué avec succès.",
                newFolderId: newFolderId,
            });

            expect(mockFoldersModel.getOwner).toHaveBeenCalledWith(folderId);
            expect(mockFoldersModel.duplicate).toHaveBeenCalledWith(folderId, "user123");
        });

        it("should return 404 when user is not the owner", async () => {
            const folderId = "folder123";
            mockFoldersModel.getOwner.mockResolvedValue("otherUser");

            const response = await request(app)
                .post("/api/folder/duplicate")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId })
                .expect(404);

            expect(response.body.message).toBe(
                "Aucun dossier portant cet identifiant n'a été trouvé."
            );
        });

        it("should return 400 when folderId is missing", async () => {
            const response = await request(app)
                .post("/api/folder/duplicate")
                .set("Authorization", `Bearer ${authToken}`)
                .send({})
                .expect(400);

            expect(response.body.message).toBe("Paramètre requis manquant.");
        });

        it("should return 500 when duplication fails", async () => {
            const folderId = "folder123";
            mockFoldersModel.getOwner.mockResolvedValue("user123");
            mockFoldersModel.duplicate.mockResolvedValue(null);

            const response = await request(app)
                .post("/api/folder/duplicate")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ folderId })
                .expect(500);

            expect(response.body.message).toBe(
                "Une erreur s'est produite lors de la duplication du dossier."
            );
        });
    });

    describe("POST /api/folder/copy/:folderId", () => {
        it("should copy folder successfully", async () => {
            const folderId = "folder123";
            const newTitle = "Copied Folder";
            const newFolderId = "folder456";
            mockFoldersModel.getOwner.mockResolvedValue("user123");
            mockFoldersModel.copy.mockResolvedValue(newFolderId);

            const response = await request(app)
                .post(`/api/folder/copy/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ newTitle })
                .expect(200);

            expect(response.body).toEqual({
                message: "Dossier copié avec succès.",
                newFolderId: newFolderId,
            });

            expect(mockFoldersModel.getOwner).toHaveBeenCalledWith(folderId);
            expect(mockFoldersModel.copy).toHaveBeenCalledWith(folderId, "user123");
        });

        it("should return 404 when user is not the owner", async () => {
            const folderId = "folder123";
            mockFoldersModel.getOwner.mockResolvedValue("otherUser");

            const response = await request(app)
                .post(`/api/folder/copy/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ newTitle: "Copied Folder" })
                .expect(404);

            expect(response.body.message).toBe(
                "Aucun dossier portant cet identifiant n'a été trouvé."
            );
        });

        it("should return 400 when newTitle is missing", async () => {
            const folderId = "folder123";

            const response = await request(app)
                .post(`/api/folder/copy/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({})
                .expect(400);

            expect(response.body.message).toBe("Données invalides: Titre requis");
        });
    });

    describe("GET /api/folder/getFolderById/:folderId", () => {
        it("should return folder by id successfully", async () => {
            const folderId = "folder123";
            const mockFolder = { _id: folderId, title: "Test Folder", userId: "user123" };
            mockFoldersModel.getOwner.mockResolvedValue("user123");
            mockFoldersModel.getFolderById.mockResolvedValue(mockFolder);

            const response = await request(app)
                .get(`/api/folder/getFolderById/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual({
                data: mockFolder,
            });

            expect(mockFoldersModel.getOwner).toHaveBeenCalledWith(folderId);
            expect(mockFoldersModel.getFolderById).toHaveBeenCalledWith(folderId);
        });

        it("should return 404 when user is not the owner", async () => {
            const folderId = "folder123";
            mockFoldersModel.getOwner.mockResolvedValue("otherUser");

            const response = await request(app)
                .get(`/api/folder/getFolderById/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.message).toBe(
                "Aucun dossier portant cet identifiant n'a été trouvé."
            );
        });

        it("should return 404 when folder not found", async () => {
            const folderId = "folder123";
            mockFoldersModel.getOwner.mockResolvedValue("user123");
            mockFoldersModel.getFolderById.mockResolvedValue(null);

            const response = await request(app)
                .get(`/api/folder/getFolderById/${folderId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.message).toBe(
                "Aucun dossier portant cet identifiant n'a été trouvé."
            );
        });
    });

    describe("POST /api/folder/folderExists", () => {
        it("should check if folder exists successfully", async () => {
            const title = "Test Folder";
            mockFoldersModel.folderExists.mockResolvedValue(true);

            const response = await request(app)
                .post("/api/folder/folderExists")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title })
                .expect(200);

            expect(response.body).toEqual({
                exists: true,
            });

            expect(mockFoldersModel.folderExists).toHaveBeenCalledWith(title, "user123");
        });

        it("should return false when folder doesn't exist", async () => {
            const title = "Non-existent Folder";
            mockFoldersModel.folderExists.mockResolvedValue(false);

            const response = await request(app)
                .post("/api/folder/folderExists")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title })
                .expect(200);

            expect(response.body).toEqual({
                exists: false,
            });
        });

        it("should return 400 when title is missing", async () => {
            const response = await request(app)
                .post("/api/folder/folderExists")
                .set("Authorization", `Bearer ${authToken}`)
                .send({})
                .expect(400);

            expect(response.body.message).toBe("Paramètre requis manquant.");
        });
    });
});