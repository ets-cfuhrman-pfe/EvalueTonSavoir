const request = require('supertest');
const express = require('express');
const db = require('../config/db');

// Mock dependencies
jest.mock('../config/db', () => ({
    getConnection: jest.fn(),
    connect: jest.fn(),
}));
jest.mock('express-rate-limit', () => {
    return jest.fn((options) => {
        // Return a middleware that attaches the options to the request for inspection
        return (req, res, next) => {
            req.rateLimitOptions = options;
            next();
        };
    });
});

// Import router after mocking
const healthRouter = require('../routers/health');

describe('Health Router', () => {
    let app;
    let mockCollection;
    let mockConnection;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock collection
        mockCollection = {
            findOne: jest.fn(),
        };

        // Setup mock connection
        mockConnection = {
            command: jest.fn(),
            collection: jest.fn().mockReturnValue(mockCollection),
        };

        // Setup mock DB connection
        db.getConnection.mockReturnValue(mockConnection);

        // Setup Express app
        app = express();
        app.use(express.json());
        app.use('/api/health', healthRouter);
    });

    describe('Rate Limiting', () => {
        it('should be configured with correct options', () => {
            jest.isolateModules(() => {
                const rateLimit = require('express-rate-limit');
                // Re-require health router to trigger rateLimit call
                require('../routers/health');
                
                expect(rateLimit).toHaveBeenCalledWith(expect.objectContaining({
                    windowMs: 60 * 1000,
                    max: 50,
                    message: expect.objectContaining({
                        status: 'error',
                        message: 'Too many requests. Please wait a moment.'
                    })
                }));
            });
        });
    });

    describe('GET /api/health', () => {
        it('should return 200 OK when DB is healthy', async () => {
            mockConnection.command.mockResolvedValue({ ok: 1 });

            const res = await request(app).get('/api/health');
            
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.services.database).toBe('up');
            expect(res.body.services.server).toBe('up');
        });

        it('should return 503 Service Unavailable when DB is down', async () => {
            mockConnection.command.mockRejectedValue(new Error('DB Connection Failed'));

            const res = await request(app).get('/api/health');
            
            expect(res.status).toBe(503);
            expect(res.body.status).toBe('error');
            expect(res.body.services.database).toBe('down');
            expect(res.body.errors.database).toBe('DB Connection Failed');
        });
    });

    describe('GET /api/health/dashboard', () => {
        it('should return 200 OK when all collections are accessible', async () => {
            mockCollection.findOne.mockResolvedValue({ _id: 1 });

            const res = await request(app).get('/api/health/dashboard');
            
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.checks.quizzes).toBe('ok');
            expect(res.body.checks.folders).toBe('ok');
            
            // Verify collections were checked
            expect(mockConnection.collection).toHaveBeenCalledWith('quizzes');
            expect(mockConnection.collection).toHaveBeenCalledWith('folders');
        });

        it('should return 503 when quizzes collection is inaccessible', async () => {
            // Mock failure for quizzes, success for folders
            mockConnection.collection.mockImplementation((name) => {
                if (name === 'quizzes') {
                    return {
                        findOne: jest.fn().mockRejectedValue(new Error('Quizzes Error'))
                    };
                }
                return mockCollection; // Default success
            });
            mockCollection.findOne.mockResolvedValue({ _id: 1 });

            const res = await request(app).get('/api/health/dashboard');
            
            expect(res.status).toBe(503);
            expect(res.body.status).toBe('error');
            expect(res.body.checks.quizzes).toBe('failed');
            expect(res.body.checks.folders).toBe('ok');
            expect(res.body.errors.quizzes).toBe('Quizzes Error');
        });

        it('should return 503 when folders collection is inaccessible', async () => {
            // Mock success for quizzes, failure for folders
            mockConnection.collection.mockImplementation((name) => {
                if (name === 'folders') {
                    return {
                        findOne: jest.fn().mockRejectedValue(new Error('Folders Error'))
                    };
                }
                return mockCollection; // Default success
            });
            mockCollection.findOne.mockResolvedValue({ _id: 1 });

            const res = await request(app).get('/api/health/dashboard');
            
            expect(res.status).toBe(503);
            expect(res.body.checks.quizzes).toBe('ok');
            expect(res.body.checks.folders).toBe('failed');
            expect(res.body.errors.folders).toBe('Folders Error');
        });
    });

    describe('GET /api/health/login', () => {
        it('should return 200 OK when users collection is accessible', async () => {
            mockCollection.findOne.mockResolvedValue({ _id: 1 });

            const res = await request(app).get('/api/health/login');
            
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.checks.users_collection).toBe('ok');
            expect(mockConnection.collection).toHaveBeenCalledWith('users');
        });

        it('should return 503 when users collection is inaccessible', async () => {
            mockCollection.findOne.mockRejectedValue(new Error('Users Error'));

            const res = await request(app).get('/api/health/login');
            
            expect(res.status).toBe(503);
            expect(res.body.status).toBe('error');
            expect(res.body.checks.users_collection).toBe('failed');
            expect(res.body.errors.users_collection).toBe('Users Error');
        });
    });

    describe('GET /api/health/join-room', () => {
        it('should return 200 OK when rooms collection is accessible', async () => {
            mockCollection.findOne.mockResolvedValue({ _id: 1 });

            const res = await request(app).get('/api/health/join-room');
            
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.checks.rooms_collection).toBe('ok');
            expect(mockConnection.collection).toHaveBeenCalledWith('rooms');
        });

        it('should return 503 when rooms collection is inaccessible', async () => {
            mockCollection.findOne.mockRejectedValue(new Error('Rooms Error'));

            const res = await request(app).get('/api/health/join-room');
            
            expect(res.status).toBe(503);
            expect(res.body.status).toBe('error');
            expect(res.body.checks.rooms_collection).toBe('failed');
            expect(res.body.errors.rooms_collection).toBe('Rooms Error');
        });
    });
});
