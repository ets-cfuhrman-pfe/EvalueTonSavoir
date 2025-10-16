//  Test Setup Index


const {
  HTTP_STATUS,
  CONSTRAINTS,
  TEST_IDS,
  TEST_USERS,
  TEST_DATA,
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
  CONSTRAINTS,
  TEST_IDS,
  TEST_USERS,
  TEST_DATA,

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
