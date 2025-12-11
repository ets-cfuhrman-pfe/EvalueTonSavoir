const request = require('supertest');
const app = require('../app');
const packageJson = require('../package.json');

// Mock the database connection to avoid connecting to real DB
jest.mock('../config/db', () => ({
  connect: jest.fn().mockResolvedValue(true),
  getConnection: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      insertOne: jest.fn(),
    })
  }),
  closeConnection: jest.fn().mockResolvedValue(true)
}));

// Mock logger to avoid cluttering test output
jest.mock('../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock httpLogger
jest.mock('../config/httpLogger', () => ({
  requestIdMiddleware: (req, res, next) => next(),
  middleware: (req, res, next) => next()
}));

// Mock loggingMiddleware
jest.mock('../middleware/logging', () => ({
  comprehensiveLogging: (req, res, next) => next()
}));

// Mock express-session
jest.mock('express-session', () => {
  return () => (req, res, next) => {
    req.session = {};
    next();
  };
});

// Mock AuthManager
jest.mock('../auth/auth-manager.js', () => {
  return class MockAuthManager {
    constructor() {}
  };
});

describe('GET /api/version', () => {
  it('should return the correct version from package.json', async () => {
    const response = await request(app).get('/api/version');
    
    if (response.status !== 200) {
        console.error('Response status:', response.status);
        console.error('Response text:', response.text);
    }

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('version');
    expect(response.body.version).toBe(packageJson.version);
  });
});
