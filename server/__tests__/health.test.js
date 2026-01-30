const request = require('supertest');
const express = require('express');
const db = require('../config/db');
const AuthConfig = require('../config/auth');
const healthFlags = require('../utils/healthFlags');

// Mock dependencies
jest.mock('../config/db', () => ({
    getConnection: jest.fn(),
    connect: jest.fn(),
}));

jest.mock('../config/auth');
// Do NOT mock http/https entirely as it breaks express/supertest
// We will spyOn checks inside the tests

jest.mock('../config/logger', () => ({
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
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
    let originalNodeEnv;

    beforeAll(() => {
        originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
    });

    afterAll(() => {
        process.env.NODE_ENV = originalNodeEnv;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        healthFlags.clearAuthLoginError();

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

        it('should return 503 when auth login flag is set', async () => {
            mockConnection.command.mockResolvedValue({ ok: 1 });
            healthFlags.setAuthLoginError(new Error('Auth login failed'));

            const res = await request(app).get('/api/health');

            expect(res.status).toBe(503);
            expect(res.body.status).toBe('error');
            expect(res.body.checks.auth_login).toBe('failed');
            expect(res.body.errors.auth_login.message).toBe('Auth login failed');
        });

        it('should return 503 Service Unavailable when DB is down', async () => {
            mockConnection.command.mockRejectedValue(new Error('DB Connection Failed'));

            const res = await request(app).get('/api/health');
            
            expect(res.status).toBe(503);
            expect(res.body.status).toBe('error');
            expect(res.body.services.database).toBe('down');
            expect(res.body.errors.database.message).toBe('DB Connection Failed');
            expect(res.body.errors.database.details).toBe('DB Connection Failed');
        });

        describe('Auth Provider Checks', () => {
            const mockOidcUrl = 'http://test-oidc/.well-known/openid-configuration';
            const mockOidcResponse = {
                issuer: 'http://test-oidc',
                authorization_endpoint: 'http://test-oidc/authorize',
                token_endpoint: 'http://test-oidc/token',
                userinfo_endpoint: 'http://test-oidc/userinfo'
            };

            beforeEach(() => {
                // Mock global fetch
                global.fetch = jest.fn((url) => {
                    if (url.includes('fail')) {
                        return Promise.reject(new Error('fetch failed'));
                    } else if (url.includes('timeout')) {
                        const abortError = new Error('This operation was aborted');
                        abortError.name = 'AbortError';
                        return Promise.reject(abortError);
                    } else if (url.includes('500')) {
                        return Promise.resolve({
                            ok: false,
                            status: 500,
                            json: () => Promise.reject(new Error('Invalid JSON'))
                        });
                    } else {
                        return Promise.resolve({
                            ok: true,
                            status: 200,
                            json: () => Promise.resolve(mockOidcResponse)
                        });
                    }
                });

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

            afterEach(() => {
                delete global.fetch;
                jest.restoreAllMocks();
            });

            it('should return 200 OK when Auth Provider is reachable', async () => {
                // Force cache reload with current config
                healthRouter.resetAuthProvidersCache();
                
                mockConnection.command.mockResolvedValue({ ok: 1 });

                const res = await request(app).get('/api/health');

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('ok');
                expect(res.body.services.auth).toBe('up');
                expect(res.body.checks.auth_providers.test_provider).toBe('up');
            });

            it('should return 503 when Auth Provider fails (Network Error)', async () => {
                // Force cache reload with updated config
                healthRouter.resetAuthProvidersCache();
                
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
                // In development mode, full error details are shown
                expect(res.body.checks.auth_providers['fail_provider']).toBe('fetch failed');
                expect(res.body.errors.auth.message).toBeDefined();
            });

            it('should return 503 when Auth Provider returns 500', async () => {
                // Force cache reload with updated config
                healthRouter.resetAuthProvidersCache();
                
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
                // In development mode, full error details are shown
                expect(res.body.checks.auth_providers['error_provider']).toBe('Status 500');
                expect(res.body.errors.auth.message).toBeDefined();
            });

            it('should return 503 when Auth Provider timeouts', async () => {
                // Force cache reload with updated config
                healthRouter.resetAuthProvidersCache();
                
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
                // In development mode, full error details are shown
                expect(res.body.checks.auth_providers['timeout_provider']).toBe('Timeout');
                expect(res.body.errors.auth.message).toBeDefined();
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
            expect(res.body.errors.quizzes.message).toBe('Quizzes Error');
            expect(res.body.errors.quizzes.details).toBe('Quizzes Error');
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
            expect(res.body.errors.folders.message).toBe('Folders Error');
            expect(res.body.errors.folders.details).toBe('Folders Error');
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
            expect(res.body.errors.users_collection.message).toBe('Users Error');
            expect(res.body.errors.users_collection.details).toBe('Users Error');
        });
    });

    describe('GET /api/health/auth-login', () => {
        it('should return 200 OK when auth login flag is clear', async () => {
            const res = await request(app).get('/api/health/auth-login');

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.checks.auth_login).toBe('ok');
        });

        it('should return 503 when auth login flag is set', async () => {
            healthFlags.setAuthLoginError('OIDC authentication failed');

            const res = await request(app).get('/api/health/auth-login');

            expect(res.status).toBe(503);
            expect(res.body.status).toBe('error');
            expect(res.body.checks.auth_login).toBe('failed');
            expect(res.body.errors.auth_login.message).toBe('OIDC authentication failed');
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
            expect(res.body.errors.rooms_collection.message).toBe('Rooms Error');
            expect(res.body.errors.rooms_collection.details).toBe('Rooms Error');
        });
    });
});
