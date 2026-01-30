const request = require('supertest');
const express = require('express');
const db = require('../config/db');
const AuthConfig = require('../config/auth');
const http = require('http');
const https = require('https');
const EventEmitter = require('events');

// Mock dependencies
jest.mock('../config/db', () => ({
    getConnection: jest.fn(),
    connect: jest.fn(),
}));

jest.mock('../config/auth');
// Do NOT mock http/https entirely as it breaks express/supertest
// We will spyOn checks inside the tests


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
        
        // Default: Empty Auth Config
        AuthConfig.mockImplementation(() => ({
            loadConfig: jest.fn().mockReturnValue({})
        }));

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
        it('should return 200 OK when DB is healthy and no auth providers', async () => {
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

        describe('Auth Provider Checks', () => {
            const mockOidcUrl = 'http://test-oidc/.well-known/openid-configuration';

            beforeEach(() => {
                // Determine logic for http/https get
                const mockGet = (url, options, cb) => {
                    const req = new EventEmitter();
                    req.destroy = jest.fn();
                    
                    // Handle options as cb if needed (http.get signature variance)
                    const callback = typeof options === 'function' ? options : cb;

                    // Simulate async response
                    process.nextTick(() => {
                        if (url.includes('fail')) {
                            req.emit('error', new Error('Network Error'));
                        } else if (url.includes('timeout')) {
                            req.emit('timeout');
                        } else if (url.includes('500')) {
                             const res = new EventEmitter();
                             res.statusCode = 500;
                             res.resume = jest.fn();
                             if(callback) callback(res);
                        } else {
                            const res = new EventEmitter();
                            res.statusCode = 200;
                            res.resume = jest.fn();
                            if(callback) callback(res);
                        }
                    });
                    return req;
                };

                jest.spyOn(http, 'get').mockImplementation(mockGet);
                jest.spyOn(https, 'get').mockImplementation(mockGet);

                // Setup Auth Config with a provider
                AuthConfig.mockImplementation(() => ({
                    loadConfig: jest.fn().mockReturnValue({
                        auth: {
                            passportjs: [{
                                "test_provider": {
                                    "OIDC_CONFIG_URL": mockOidcUrl
                                }
                            }]
                        }
                    })
                }));
            });

            it('should return 200 OK when Auth Provider is reachable', async () => {
                mockConnection.command.mockResolvedValue({ ok: 1 });

                const res = await request(app).get('/api/health');

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('ok');
                expect(res.body.services.auth).toBe('up');
                expect(res.body.checks.auth_providers.test_provider).toBe('up');
            });

            it('should return 503 when Auth Provider fails (Network Error)', async () => {
                mockConnection.command.mockResolvedValue({ ok: 1 });
                AuthConfig.mockImplementation(() => ({
                    loadConfig: jest.fn().mockReturnValue({
                        auth: {
                            passportjs: [{
                                "fail_provider": { "OIDC_CONFIG_URL": "http://fail" }
                            }]
                        }
                    })
                }));

                const res = await request(app).get('/api/health');

                expect(res.status).toBe(503);
                expect(res.body.status).toBe('error');
                expect(res.body.services.auth).toBe('down');
                expect(res.body.errors.auth['fail_provider']).toBe('Network Error');
            });

            it('should return 503 when Auth Provider returns 500', async () => {
                mockConnection.command.mockResolvedValue({ ok: 1 });
                AuthConfig.mockImplementation(() => ({
                    loadConfig: jest.fn().mockReturnValue({
                        auth: {
                            passportjs: [{
                                "error_provider": { "OIDC_CONFIG_URL": "http://500" }
                            }]
                        }
                    })
                }));

                const res = await request(app).get('/api/health');

                expect(res.status).toBe(503);
                expect(res.body.services.auth).toBe('down');
                expect(res.body.errors.auth['error_provider']).toBe('Status 500');
            });

            it('should return 503 when Auth Provider timeouts', async () => {
                mockConnection.command.mockResolvedValue({ ok: 1 });
                AuthConfig.mockImplementation(() => ({
                    loadConfig: jest.fn().mockReturnValue({
                        auth: {
                            passportjs: [{
                                "timeout_provider": { "OIDC_CONFIG_URL": "http://timeout" }
                            }]
                        }
                    })
                }));

                const res = await request(app).get('/api/health');

                expect(res.status).toBe(503);
                expect(res.body.errors.auth['timeout_provider']).toBe('Timeout');
            });
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
