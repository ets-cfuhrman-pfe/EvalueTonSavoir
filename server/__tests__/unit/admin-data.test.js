const AdminDataController = require('../../controllers/adminData');
const AppError = require('../../middleware/AppError');
const { UNAUTHORIZED_ACCESS_DENIED, MISSING_REQUIRED_PARAMETER } = require('../../constants/errorCodes');
const { EJSON } = require('bson');

describe('AdminDataController', () => {
  let adminDataController;
  let mockDbConnection;
  let mockCollection;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockCollection = {
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    };

    mockDbConnection = {
      connect: jest.fn().mockResolvedValue(),
      getConnection: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollection),
      }),
    };

    adminDataController = new AdminDataController(mockDbConnection);

    req = {
      user: {
        userId: 'admin123',
        roles: ['admin'],
      },
      params: {
        userId: 'targetUser123',
      },
      logAction: jest.fn(),
    };

    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    next = jest.fn();
  });

  describe('exportAllResources', () => {
    it('should export all resources for a valid admin request', async () => {
      const mockFolders = [{ _id: 'folder1', title: 'Folder 1' }];
      const mockQuizzes = [{ _id: 'quiz1', title: 'Quiz 1' }];
      
      mockCollection.toArray
        .mockResolvedValueOnce(mockFolders) // folders
        .mockResolvedValueOnce(mockQuizzes) // quizzes
        .mockResolvedValueOnce([]) // images
        .mockResolvedValueOnce([]); // rooms

      await adminDataController.exportAllResources(req, res, next);

      expect(mockDbConnection.connect).toHaveBeenCalled();
      expect(mockDbConnection.getConnection).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(res.setHeader).toHaveBeenCalledWith(expect.stringContaining('Content-Disposition'), expect.stringContaining('attachment; filename="all-data-targetUser123-'));
      expect(res.status).toHaveBeenCalledWith(200);
      
      const sentData = EJSON.parse(res.send.mock.calls[0][0]);
      expect(sentData).toHaveProperty('folders');
      expect(sentData).toHaveProperty('quizzes');
      expect(sentData).toHaveProperty('images');
      expect(sentData).toHaveProperty('rooms');
      expect(sentData.folders).toEqual(mockFolders);
      expect(sentData.quizzes).toEqual(mockQuizzes);
      
      expect(req.logAction).toHaveBeenCalledWith('admin_export_all_user_data', expect.any(Object));
    });

    it('should throw UNAUTHORIZED_ACCESS_DENIED if user is not admin', async () => {
      req.user.roles = ['user'];

      await adminDataController.exportAllResources(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(UNAUTHORIZED_ACCESS_DENIED.code);
      expect(error.message).toBe(UNAUTHORIZED_ACCESS_DENIED.message);
    });

    it('should throw MISSING_REQUIRED_PARAMETER if userId is missing', async () => {
      req.params.userId = undefined;

      await adminDataController.exportAllResources(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(MISSING_REQUIRED_PARAMETER.code);
      expect(error.message).toBe(MISSING_REQUIRED_PARAMETER.message);
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockDbConnection.connect.mockRejectedValue(dbError);

      await adminDataController.exportAllResources(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
});
