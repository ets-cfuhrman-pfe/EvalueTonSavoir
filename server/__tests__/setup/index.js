//  Test Setup Index


const {
  HTTP_STATUS,
  TEST_IDS,
  TEST_USERS,
  TEST_DATA,
  COMMON_MESSAGES,
  QUIZ_MESSAGES,
  ROOM_MESSAGES,
  AppError,
  QUIZ_ALREADY_EXISTS,
  MISSING_REQUIRED_PARAMETER,
  NOT_IMPLEMENTED,
  QUIZ_NOT_FOUND,
  FOLDER_NOT_FOUND,
  GETTING_QUIZ_ERROR,
  DELETE_QUIZ_ERROR,
  UPDATE_QUIZ_ERROR,
  MOVING_QUIZ_ERROR,
  GETTING_ROOM_ERROR,
  ROOM_NOT_FOUND,
  DELETE_ROOM_ERROR,
  ROOM_ALREADY_EXISTS,
  UPDATE_ROOM_ERROR,
  validationConstants,
} = require('./constants');

const {
  createMockLogger,
  createMockQuizModel,
  createMockFolderModel,
  createMockRoomModel,
  createMockUserModel,
  createMockImageModel,
  createTestUser,
  generateAuthToken,
  createBaseApp,
  createMockQuiz,
  createMockFolder,
  createMockRoom,
  createMockImage,
  assertSuccess,
  assertError,
  assertAuthError,
  assertOwnershipError,
  assertConflictError,
  assertValidationError,
  assertLogUserAction,
  assertLogDatabaseOperation,
  assertLogSecurityEvent,
} = require('./mocks');

module.exports = {
  // Constants
  HTTP_STATUS,
  TEST_IDS,
  TEST_USERS,
  TEST_DATA,
  COMMON_MESSAGES,
  QUIZ_MESSAGES,
  ROOM_MESSAGES,
  AppError,
  QUIZ_ALREADY_EXISTS,
  MISSING_REQUIRED_PARAMETER,
  NOT_IMPLEMENTED,
  QUIZ_NOT_FOUND,
  FOLDER_NOT_FOUND,
  GETTING_QUIZ_ERROR,
  DELETE_QUIZ_ERROR,
  UPDATE_QUIZ_ERROR,
  MOVING_QUIZ_ERROR,
  GETTING_ROOM_ERROR,
  ROOM_NOT_FOUND,
  DELETE_ROOM_ERROR,
  ROOM_ALREADY_EXISTS,
  UPDATE_ROOM_ERROR,
  validationConstants,

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
