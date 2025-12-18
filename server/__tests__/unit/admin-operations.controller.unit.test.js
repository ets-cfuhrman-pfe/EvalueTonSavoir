const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const FoldersController = require('../../controllers/folders');
const RoomsController = require('../../controllers/room');
const ImagesController = require('../../controllers/images');
const jwtMiddleware = require('../../middleware/jwtToken');
const asyncHandler = require('../../routers/routerUtils');
const errorHandler = require('../../middleware/errorHandler');

// Mock models
const mockFoldersModel = { getUserFolders: jest.fn(), getOwner: jest.fn(), getContent: jest.fn() };
const mockRoomsModel = { getUserRooms: jest.fn() };
const mockImagesModel = { getUserImages: jest.fn() };

// Mock logger
jest.mock('../../config/logger', () => ({
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
  logSecurityEvent: jest.fn(),
  logDatabaseOperation: jest.fn(),
}));

const logger = require('../../config/logger');

const createTestApp = () => {
  const app = express();
  app.use(bodyParser.json());
  app.use((req, res, next) => {
    // Mock logging helpers
    req.logAction = (action, details = {}) => logger.logUserAction(req.user?.userId, req.user?.email, action, details);
    req.logSecurity = (event, level, details = {}) => logger.logSecurityEvent(event, level, details);
    req.logDbOperation = (op, collection, duration, success, details = {}) => logger.logDatabaseOperation(op, collection, duration, success, details);
    next();
  });

  // Controllers
  const foldersController = new FoldersController(mockFoldersModel);
  const roomsController = new RoomsController(mockRoomsModel);
  const imagesController = new ImagesController(mockImagesModel);

  // No additional debug auth header

  app.get('/api/folder/getUserFolders', jwtMiddleware.authenticate, asyncHandler(foldersController.getUserFolders));
  app.get('/api/folder/getFolderContent/:folderId', jwtMiddleware.authenticate, asyncHandler(foldersController.getFolderContent));
  app.get('/api/image/getUserImages', jwtMiddleware.authenticate, asyncHandler(imagesController.getUserImages));
  app.get('/api/room/getRoomTitleByUserId/:userId', jwtMiddleware.authenticate, asyncHandler(roomsController.getRoomTitleByUserId));

  app.use(errorHandler);

  return app;
};

describe('Admin operations logging', () => {
  const ADMIN_USER = { email: 'admin@example.com', userId: 'admin123', roles: ['admin'] };
  const NON_ADMIN_USER = { email: 'user@example.com', userId: 'user123', roles: ['teacher'] };
  const TARGET_USERID = 'user123';
  const LOG_ADMIN_GET_USER_FOLDERS = 'admin_get_user_folders';
  const LOG_ADMIN_GET_USER_IMAGES = 'admin_get_user_images';
  const LOG_ADMIN_GET_USER_ROOM_TITLES = 'admin_get_user_room_titles';
  const LOG_ADMIN_GET_USER_FOLDER_CONTENT = 'admin_get_user_folder_content'; // Use constant for folder content assertions
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log admin_get_user_folders when admin requests folders for another user', async () => {
    const app = createTestApp();
    const adminToken = jwt.sign(ADMIN_USER, process.env.JWT_SECRET);

    const mockFolders = [{ _id: 'f1', title: 'Folder 1' }];
    mockFoldersModel.getUserFolders.mockResolvedValue(mockFolders);

    const res = await request(app)
      .get(`/api/folder/getUserFolders?uid=${TARGET_USERID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    if (res.status !== 200) {
      console.log('Response status:', res.status);
      console.log('Response body:', JSON.stringify(res.body));
      console.log('Response text:', res.text);
      console.log('Mock getUserFolders called:', mockFoldersModel.getUserFolders.mock.calls.length);
    }

    expect(res.body.data).toBeDefined();
    expect(logger.logUserAction).toHaveBeenCalled();
    const lastCall = logger.logUserAction.mock.calls[logger.logUserAction.mock.calls.length - 1];
    expect(lastCall[2]).toBe(LOG_ADMIN_GET_USER_FOLDERS);
  });

  it('should log admin_get_user_images when admin requests images for another user', async () => {
    const app = createTestApp();
    const adminToken = jwt.sign(ADMIN_USER, process.env.JWT_SECRET);

    // `getUserImages` returns an array of images
    const mockImgs = [{ id: 'i1', file_name: 'a.png' }];
    mockImagesModel.getUserImages.mockResolvedValue(mockImgs);

    const res2 = await request(app)
      .get(`/api/image/getUserImages?uid=${TARGET_USERID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    if (res2.status !== 200) {
      console.log('Response status:', res2.status);
      console.log('Response body:', JSON.stringify(res2.body));
      console.log('Response text:', res2.text);
      console.log('Mock getUserImages called:', mockImagesModel.getUserImages.mock.calls.length);
    }

    expect(logger.logUserAction).toHaveBeenCalled();
    const lastCall = logger.logUserAction.mock.calls[logger.logUserAction.mock.calls.length - 1];
    expect(lastCall[2]).toBe(LOG_ADMIN_GET_USER_IMAGES);
  });

  it('should log admin_get_user_room_titles when admin requests titles for another user', async () => {
    const app = createTestApp();
    const adminToken = jwt.sign(ADMIN_USER, process.env.JWT_SECRET);

    const mockRooms = [{ title: 'Room 1' }];
    mockRoomsModel.getUserRooms.mockResolvedValue(mockRooms);

    const res3 = await request(app)
      .get(`/api/room/getRoomTitleByUserId/${TARGET_USERID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    if (res3.status !== 200) {
      console.log('Response status:', res3.status);
      console.log('Response body:', JSON.stringify(res3.body));
      console.log('Response text:', res3.text);
      console.log('Mock getUserRooms called:', mockRoomsModel.getUserRooms.mock.calls.length);
    }

    expect(logger.logUserAction).toHaveBeenCalled();
    const lastCall = logger.logUserAction.mock.calls[logger.logUserAction.mock.calls.length - 1];
    expect(lastCall[2]).toBe(LOG_ADMIN_GET_USER_ROOM_TITLES);
  });

  it('should NOT log admin_get_user_folders when non-admin tries to use uid query', async () => {
    const app = createTestApp();
    const nonAdminToken = jwt.sign(NON_ADMIN_USER, process.env.JWT_SECRET);

    mockFoldersModel.getUserFolders.mockResolvedValue([]);

    const res = await request(app)
      .get(`/api/folder/getUserFolders?uid=${TARGET_USERID}`)
      .set('Authorization', `Bearer ${nonAdminToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    // Ensure admin log not called
    const adminFolderLogs = logger.logUserAction.mock.calls.filter(call => call[2] === LOG_ADMIN_GET_USER_FOLDERS);
    expect(adminFolderLogs.length).toBe(0);
  });

  it('should NOT log admin_get_user_images when non-admin tries to use uid query', async () => {
    const app = createTestApp();
    const nonAdminToken = jwt.sign(NON_ADMIN_USER, process.env.JWT_SECRET);

    mockImagesModel.getUserImages.mockResolvedValue([{ id: 'img1', file_name: '1.png' }]);

    await request(app)
      .get(`/api/image/getUserImages?uid=${TARGET_USERID}`)
      .set('Authorization', `Bearer ${nonAdminToken}`)
      .expect(200);

    const adminLogs = logger.logUserAction.mock.calls.filter(c => c[2] === LOG_ADMIN_GET_USER_IMAGES);
    expect(adminLogs.length).toBe(0);
  });

  it('should NOT log admin_get_user_room_titles when non-admin requests titles for another user', async () => {
    const app = createTestApp();
    const nonAdminToken = jwt.sign(NON_ADMIN_USER, process.env.JWT_SECRET);

    mockRoomsModel.getUserRooms.mockResolvedValue([{ title: 'R' }]);

    await request(app)
      .get(`/api/room/getRoomTitleByUserId/${TARGET_USERID}`)
      .set('Authorization', `Bearer ${nonAdminToken}`)
      .expect(200);

    const adminLogs = logger.logUserAction.mock.calls.filter(c => c[2] === LOG_ADMIN_GET_USER_ROOM_TITLES);
    expect(adminLogs.length).toBe(0);
  });

  it('should allow admin to get folder content for another user and log the admin action', async () => {
    const app = createTestApp();
    const adminToken = jwt.sign(ADMIN_USER, process.env.JWT_SECRET);

    const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
    const folderOwner = 'owner123';
    const folderContent = [{ title: 'Quiz A', content: [] }];

    mockFoldersModel.getOwner.mockResolvedValue(folderOwner);
    mockFoldersModel.getContent.mockResolvedValue(folderContent);

    const res = await request(app)
      .get(`/api/folder/getFolderContent/${folderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    const adminFolderContentLogs = logger.logUserAction.mock.calls.find(call => call[2] === LOG_ADMIN_GET_USER_FOLDER_CONTENT);
    expect(adminFolderContentLogs).toBeTruthy();
  });

  it('should return 404 for non-admin trying to access another user\'s folder content', async () => {
    const app = createTestApp();
    const nonAdminToken = jwt.sign(NON_ADMIN_USER, process.env.JWT_SECRET);

    const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
    const folderOwner = 'someOtherUser';

    mockFoldersModel.getOwner.mockResolvedValue(folderOwner);
    mockFoldersModel.getContent.mockResolvedValue([]);

    const res = await request(app)
      .get(`/api/folder/getFolderContent/${folderId}`)
      .set('Authorization', `Bearer ${nonAdminToken}`)
      .expect(404);

    expect(res.body.message).toBeDefined();
    const found = logger.logUserAction.mock.calls.find(call => call[2] === LOG_ADMIN_GET_USER_FOLDER_CONTENT);
    expect(found).toBeUndefined();
  });
});
