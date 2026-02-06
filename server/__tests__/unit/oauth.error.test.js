const PassportOAuth = require('../../auth/modules/passport-providers/oauth');
const health = require('../../config/health');

// Mocks
jest.mock('../../config/logger', () => ({
    error: jest.fn(),
    info: jest.fn()
}));

jest.mock('../../config/health', () => ({
    markOAuthTokenFailure: jest.fn(),
    clearOAuthTokenFailure: jest.fn(),
    checkAndMarkOAuthTokenFailure: jest.fn()
}));

jest.mock('../../models/authUserAssociation');
jest.mock('../../utils');

// Mock Passport Strategy
jest.mock('passport-oauth2', () => jest.fn());

describe('PassportOAuth Error Handling Unit Test', () => {
    let passportOAuth;
    let mockApp;
    let mockPassport;
    let registeredRoutes = {};

    beforeEach(() => {
        jest.clearAllMocks();
        registeredRoutes = {};

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
        passportOAuth = new PassportOAuth(
            { authenticate: jest.fn() }, // passportjs wrapper mock
            'test-auth'
        );
        
        // Mock Register dependencies
        const provider = {
            OAUTH_AUTHORIZATION_URL: 'url',
            OAUTH_TOKEN_URL: 'url',
            OAUTH_CLIENT_ID: 'id',
            OAUTH_CLIENT_SECRET: 'secret',
            OAUTH_USERINFO_URL: 'url',
            OAUTH_ADD_SCOPE: ''
        };
        const userModel = { getById: jest.fn() };

        passportOAuth.register(mockApp, mockPassport, '/auth', 'oauth', provider, userModel);
    });

    const getCallbackParams = () => {
        const route = '/auth/oauth/callback';
        const handlers = registeredRoutes[route]; 
        // handlers: [authenticate_middleware, success_handler, error_handler]
        return {
            authenticateMW: handlers[0],
            successHandler: handlers[1],
            errorHandler: handlers[2]
        };
    };

    test('Error Handler: delegates to health.checkAndMarkOAuthTokenFailure', () => {
        const { errorHandler } = getCallbackParams();
        const req = {};
        const res = { redirect: jest.fn() };
        const next = jest.fn();

        const err = {
            name: 'InternalOAuthError',
            message: 'Failed to obtain access token',
            statusCode: 500
        };

        errorHandler(err, req, res, next);

        expect(health.checkAndMarkOAuthTokenFailure).toHaveBeenCalledWith(err, 'oauth');
        expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    test('Success Handler: clears health failure', () => {
        const { successHandler } = getCallbackParams();
        const req = { user: { id: 1 } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        successHandler(req, res, next);

        expect(health.clearOAuthTokenFailure).toHaveBeenCalled();
        // Should call passportjs.authenticate (the wrapper)
        expect(passportOAuth.passportjs.authenticate).toHaveBeenCalledWith(req.user, req, res);
    });
});
