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
const mockFoldersModel = { getUserFolders: jest.fn() };
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
  app.get('/api/image/getUserImages', jwtMiddleware.authenticate, asyncHandler(imagesController.getUserImages));
  app.get('/api/room/getRoomTitleByUserId/:userId', jwtMiddleware.authenticate, asyncHandler(roomsController.getRoomTitleByUserId));

  app.use(errorHandler);

  return app;
};

describe('Admin operations logging', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log admin_get_user_folders when admin requests folders for another user', async () => {
    const app = createTestApp();
    const adminUser = { email: 'admin@example.com', userId: 'admin123', roles: ['admin'] };
    // JWT secret used across tests
    process.env.JWT_SECRET = 'test-secret-key';
    const adminToken = jwt.sign(adminUser, process.env.JWT_SECRET);

    mockFoldersModel.getUserFolders.mockResolvedValue([{ _id: 'f1', title: 'Folder 1' }]);

    const res = await request(app)
      .get('/api/folder/getUserFolders?uid=user123')
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
    expect(lastCall[2]).toBe('admin_get_user_folders');
  });

  it('should log admin_get_user_images when admin requests images for another user', async () => {
    const app = createTestApp();
    const adminUser = { email: 'admin@example.com', userId: 'admin123', roles: ['admin'] };
    const adminToken = jwt.sign(adminUser, process.env.JWT_SECRET);

    // `getUserImages` returns an array of images (same shape as other image tests)
    mockImagesModel.getUserImages.mockResolvedValue([{ id: 'i1', file_name: 'a.png' }]);

    const res2 = await request(app)
      .get('/api/image/getUserImages?uid=user123')
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
    expect(lastCall[2]).toBe('admin_get_user_images');
  });

  it('should log admin_get_user_room_titles when admin requests titles for another user', async () => {
    const app = createTestApp();
    const adminUser = { email: 'admin@example.com', userId: 'admin123', roles: ['admin'] };
    const adminToken = jwt.sign(adminUser, process.env.JWT_SECRET);

    mockRoomsModel.getUserRooms.mockResolvedValue([{ title: 'Room 1' }]);

    const res3 = await request(app)
      .get('/api/room/getRoomTitleByUserId/user123')
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
    expect(lastCall[2]).toBe('admin_get_user_room_titles');
  });
});
