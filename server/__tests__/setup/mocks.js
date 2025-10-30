/**
 * Test Setup & Mocks
 * Mock factories, utility functions, and assertion helpers used across all API tests
 */

const jwt = require('jsonwebtoken');
const express = require('express');
const bodyParser = require('body-parser');
const { TEST_USERS } = require('./constants');

// MOCK LOGGER
const createMockLogger = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn(function() {
    return createMockLogger();
  }),
  logUserAction: jest.fn(),
  logApiRequest: jest.fn(),
  logSecurityEvent: jest.fn(),
  logDatabaseOperation: jest.fn(),
});

// MOCK MODEL FACTORIES
const createMockQuizModel = () => ({
  create: jest.fn(),
  getContent: jest.fn(),
  getOwner: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  move: jest.fn(),
  duplicate: jest.fn(),
  copy: jest.fn(),
  quizExists: jest.fn(),
  deleteQuizzesByFolderId: jest.fn(),
});

const createMockFolderModel = () => ({
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
});

const createMockRoomModel = () => ({
  create: jest.fn(),
  getUserRooms: jest.fn(),
  getContent: jest.fn(),
  getOwner: jest.fn(),
  delete: jest.fn(),
  rename: jest.fn(),
  getRoomById: jest.fn(),
  roomExists: jest.fn(),
});

const createMockUserModel = () => ({
  register: jest.fn(),
  login: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
  delete: jest.fn(),
});

const createMockImageModel = () => ({
  upload: jest.fn(),
  get: jest.fn(),
  getImages: jest.fn(),
  getUserImages: jest.fn(),
  delete: jest.fn(),
});


// USER & TOKEN UTILITIES
/**
 * Create a test user with optional overrides
 * @param {Object} overrides - Properties to override in default user
 * @returns {Object} Test user object
 */
const createTestUser = (overrides = {}) => ({
  ...TEST_USERS.DEFAULT,
  ...overrides,
});

/**
 * Generate JWT token for authenticated requests
 * @param {Object} user - User object to encode in token
 * @param {string} secret - JWT secret (defaults to test secret)
 * @returns {string} JWT token string
 */
const generateAuthToken = (user = TEST_USERS.DEFAULT, secret = 'test-secret-key') => {
  return jwt.sign(user, secret);
};


// BASE EXPRESS APP SETUP
/**
 * Create base Express app with common middleware
 * @param {Function} requestIdMiddleware - Optional request ID middleware
 * @param {Object} mockLogger - Logger mock for middleware
 * @returns {express.Application} Configured Express app
 */
const createBaseApp = (requestIdMiddleware = null, mockLogger = null) => {
  const app = express();
  
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Add request ID middleware if provided
  if (requestIdMiddleware) {
    app.use(requestIdMiddleware);
  }

  // Add mock logging middleware
  const logger = mockLogger || createMockLogger();
  app.use((req, res, next) => {
    req.logAction = (action, details) => {
      if (req.user) {
        logger.logUserAction(req.user.userId, req.user.email, action, details);
      } else {
        logger.warn(`Action attempted without authentication: ${action}`, details);
      }
    };
    req.logSecurity = (event, level, details) => 
      logger.logSecurityEvent(event, level, details);
    req.logDbOperation = (operation, collection, duration, success, details) => 
      logger.logDatabaseOperation(operation, collection, duration, success, details);
    next();
  });

  return app;
};

// MOCK DATA FACTORIES

/**
 * Create a mock quiz with optional overrides
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock quiz object
 */
const createMockQuiz = (overrides = {}) => ({
  _id: 'quiz123',
  title: 'Test Quiz',
  content: 'Quiz content',
  userId: TEST_USERS.DEFAULT.userId,
  folderId: 'folder123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock folder with optional overrides
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock folder object
 */
const createMockFolder = (overrides = {}) => ({
  _id: 'folder123',
  title: 'Test Folder',
  userId: TEST_USERS.DEFAULT.userId,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock room with optional overrides
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock room object
 */
const createMockRoom = (overrides = {}) => ({
  _id: 'room123',
  title: 'Test Room',
  userId: TEST_USERS.DEFAULT.userId,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock image with optional overrides
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock image object
 */
const createMockImage = (overrides = {}) => ({
  _id: 'image123',
  name: 'test.jpg',
  size: 102400,
  userId: TEST_USERS.DEFAULT.userId,
  uploadedAt: new Date().toISOString(),
  ...overrides,
});


// ASSERTION HELPERS
/**
 * Assert standard success response
 * @param {Object} response - Supertest response object
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {string} expectedMessage - Expected response message
 */
const assertSuccess = (response, expectedStatus, expectedMessage) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.message).toBe(expectedMessage);
};

/**
 * Assert standard error response with message containment
 * @param {Object} response - Supertest response object
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {string} expectedMessagePart - Expected message substring
 */
const assertError = (response, expectedStatus, expectedMessagePart) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.message).toContain(expectedMessagePart);
};

/**
 * Assert authentication error (missing or invalid token)
 * @param {Object} response - Supertest response object
 * @param {boolean} withToken - True if testing invalid token, false for missing token
 */
const assertAuthError = (response, withToken = false) => {
  const { HTTP_STATUS } = require('./constants');
  expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  if (withToken) {
    expect(response.body.message).toBe('Accès refusé. Jeton invalide.');
  } else {
    expect(response.body.message).toBe('Accès refusé. Aucun jeton fourni.');
  }
};

/**
 * Assert ownership/permission check failed
 * @param {Object} response - Supertest response object
 * @param {string} entityType - Type of entity (quiz, folder, room, etc.)
 */
const assertOwnershipError = (response, entityType = 'entité') => {
  const { HTTP_STATUS } = require('./constants');
  expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
  expect(response.body.message).toContain(entityType);
};

/**
 * Assert conflict error (resource already exists)
 * @param {Object} response - Supertest response object
 * @param {string} resourceType - Type of resource (quiz, folder, etc.)
 */
const assertConflictError = (response, resourceType = 'ressource') => {
  const { HTTP_STATUS } = require('./constants');
  expect(response.status).toBe(HTTP_STATUS.CONFLICT);
  expect(response.body.message).toContain(resourceType);
};

/**
 * Assert validation error with specific field constraint
 * @param {Object} response - Supertest response object
 * @param {string} constraintDescription - Description of what failed validation
 */
const assertValidationError = (response, constraintDescription) => {
  const { HTTP_STATUS } = require('./constants');
  expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
  expect(response.body.message).toContain(constraintDescription);
};


// LOGGING ASSERTION HELPERS
/**
 * Assert logger.logUserAction was called with expected parameters
 * @param {Object} mockLogger - Mock logger object
 * @param {string} userId - Expected userId
 * @param {string} email - Expected email
 * @param {string} action - Expected action
 */
const assertLogUserAction = (mockLogger, userId, email, action) => {
  expect(mockLogger.logUserAction).toHaveBeenCalledWith(
    userId,
    email,
    action,
    expect.any(Object)
  );
};

/**
 * Assert logger.logDatabaseOperation was called
 * @param {Object} mockLogger - Mock logger object
 * @param {string} operation - Expected operation (insert, update, delete, etc.)
 * @param {string} collection - Expected collection name
 */
const assertLogDatabaseOperation = (mockLogger, operation, collection) => {
  expect(mockLogger.logDatabaseOperation).toHaveBeenCalledWith(
    operation,
    collection,
    expect.any(Number),
    expect.any(Boolean),
    expect.any(Object)
  );
};

/**
 * Assert logger.logSecurityEvent was called
 * @param {Object} mockLogger - Mock logger object
 * @param {string} eventType - Expected event type
 */
const assertLogSecurityEvent = (mockLogger, eventType) => {
  expect(mockLogger.logSecurityEvent).toHaveBeenCalledWith(
    eventType,
    expect.any(String),
    expect.any(Object)
  );
};


// EXPORTS
module.exports = {
  // Mock factories
  createMockLogger,
  createMockQuizModel,
  createMockFolderModel,
  createMockRoomModel,
  createMockUserModel,
  createMockImageModel,

  // User & token utilities
  createTestUser,
  generateAuthToken,

  // App setup
  createBaseApp,

  // Mock data factories
  createMockQuiz,
  createMockFolder,
  createMockRoom,
  createMockImage,

  // Assertion helpers
  assertSuccess,
  assertError,
  assertAuthError,
  assertOwnershipError,
  assertConflictError,
  assertValidationError,

  // Logging assertion helpers
  assertLogUserAction,
  assertLogDatabaseOperation,
  assertLogSecurityEvent,
};
