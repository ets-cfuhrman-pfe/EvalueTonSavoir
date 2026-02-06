const PassportOIDC = require('../../auth/modules/passport-providers/oidc');
const health = require('../../config/health');

// Mocks
jest.mock('../../config/logger', () => ({
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
}));

jest.mock('../../config/health', () => ({
    markOAuthTokenFailure: jest.fn(),
    clearOAuthTokenFailure: jest.fn(),
    checkAndMarkOAuthTokenFailure: jest.fn()
}));

jest.mock('../../models/authUserAssociation');
jest.mock('../../utils');
jest.mock('express-list-endpoints', () => jest.fn(() => []));
jest.mock('../../middleware/AppError', () => class AppError extends Error {});

// Mock Passport Strategy
jest.mock('passport-openidconnect', () => class MockStrategy {});

describe('PassportOIDC Error Handling Unit Test', () => {
    let passportOIDC;
    let mockApp;
    let mockPassport;
    let registeredRoutes = {};

    beforeEach(() => {
        jest.clearAllMocks();
        registeredRoutes = {};
        
        // Mock global fetch for OIDC config
        global.fetch = jest.fn(() => Promise.resolve({
            json: () => Promise.resolve({
                issuer: 'test-issuer',
                authorization_endpoint: 'test-auth-url',
                token_endpoint: 'test-token-url',
                userinfo_endpoint: 'test-userinfo-url'
            })
        }));

        // Mock Express App
        mockApp = {
            get: jest.fn((path, ...handlers) => {
                registeredRoutes[path] = handlers;
            })
        };

        // Mock Passport
        mockPassport = {
            use: jest.fn(),
            authenticate: jest.fn(() => (req, res, next) => next())
        };

        // Initialize
        passportOIDC = new PassportOIDC(
            { authenticate: jest.fn() }, // passportjs wrapper mock
            'test-auth'
        );
    });

    afterAll(() => {
        delete global.fetch; // Clean up globals
    });

    const getCallbackParams = () => {
        const route = '/auth/oidc/callback';
        const handlers = registeredRoutes[route]; 
        // handlers: [authenticate_middleware, success_handler, error_handler]
        // verify index in oidc.js:
        // app.get(..., authenticate(failWithError), successHandler, errorHandler)
        return {
            authenticateMW: handlers[0],
            successHandler: handlers[1],
            errorHandler: handlers[2]
        };
    };

    test('Error Handler: delegates to health.checkAndMarkOAuthTokenFailure and redirects', async () => {
        const provider = {
            OIDC_CONFIG_URL: 'http://config',
            OIDC_CLIENT_ID: 'id',
            OIDC_CLIENT_SECRET: 'secret',
            OIDC_ADD_SCOPE: ''
        };
        const userModel = {};

        await passportOIDC.register(mockApp, mockPassport, '/auth', 'oidc', provider, userModel);

        const { errorHandler } = getCallbackParams();
        const req = {};
        const res = { redirect: jest.fn() };
        const next = jest.fn();

        const err = {
            name: 'InternalOAuthError',
            message: 'Failed to obtain access token',
            statusCode: 500,
            oauthError: { statusCode: 500, data: 'internal server error' }
        };

        errorHandler(err, req, res, next);

        // Verify delegation
        expect(health.checkAndMarkOAuthTokenFailure).toHaveBeenCalledWith(err, 'oidc');
        expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    test('Success Handler: clears health failure and proceeds', async () => {
        const provider = {
            OIDC_CONFIG_URL: 'http://config',
            OIDC_CLIENT_ID: 'id',
            OIDC_CLIENT_SECRET: 'secret',
            OIDC_ADD_SCOPE: ''
        };
        const userModel = {};

        await passportOIDC.register(mockApp, mockPassport, '/auth', 'oidc', provider, userModel);

        const { successHandler } = getCallbackParams();
        const req = { user: { id: 1, name: 'Test User' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        
        successHandler(req, res);

        expect(health.clearOAuthTokenFailure).toHaveBeenCalled();
        expect(passportOIDC.passportjs.authenticate).toHaveBeenCalledWith(req.user, req, res);
    });
});
