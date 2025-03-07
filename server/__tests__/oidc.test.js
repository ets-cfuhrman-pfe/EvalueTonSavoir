let PassportOpenIDConnect = require('../auth/modules/passport-providers/oidc');
const AppError = require('../middleware/AppError');
const authUserAssoc = require('../models/authUserAssociation');
const userModel = require('../models/users');

global.fetch = jest.fn();

// Mock the authUserAssoc methods
jest.mock('../models/authUserAssociation', () => ({
  find_user_association: jest.fn(),
  link: jest.fn(),
  unlink: jest.fn(),
}));
  
  // Mock userModel methods
jest.mock('../models/users', () => ({
  getById: jest.fn(),
  getId: jest.fn(),
  generatePassword: jest.fn(),
  register: jest.fn(),
  editUser: jest.fn(),
}));
  
  // Mock db connection methods
jest.mock('../config/db', () => ({
  connect: jest.fn(),
  getConnection: jest.fn(() => ({
    collection: jest.fn(() => ({
      findOne: jest.fn(),
      insertOne: jest.fn(),
      deleteOne: jest.fn(),
    })),
  })),
}));
    
const getProfileMock = (id = 'test-auth-id', email = 'test@example.com', name = 'Test User', roles = ['teacher']) => ({
  id,
  emails: [{ value: email }],
  name: { displayName: name },
  roles,
});

const setupMocks = (authAssocReturn = null, userReturn = null, fetchReturn = {}) => {
  // Mock authUserAssoc and userModel
  authUserAssoc.find_user_association.mockResolvedValue(authAssocReturn);
  userModel.getId.mockResolvedValue(userReturn);
  userModel.getById.mockResolvedValue(userReturn);
  
    // Mock fetch to return a fake configuration
  fetch.mockResolvedValue({
    json: jest.fn().mockResolvedValue(fetchReturn),
  });
};

const createOidcConfig = () => ({
  OIDC_CONFIG_URL: 'https://example.com/.well-known/openid-configuration',
  OIDC_CLIENT_ID: 'test-client-id',
  OIDC_CLIENT_SECRET: 'test-client-secret',
  OIDC_ADD_SCOPE: '',
  OIDC_ROLE_TEACHER_VALUE: 'teacher',
  OIDC_ROLE_STUDENT_VALUE: 'student',
  tokenURL: 'https://example.com/token',
});

describe('PassportOpenIDConnect Class', () => {
    let passportMock;
    let appMock;
    let oidcInstance;

    beforeEach(() => {
        passportMock = { use: jest.fn(), register: jest.fn(), authenticate: jest.fn()};
        appMock = { get: jest.fn() };

        // Mock configuration object
        const oidcConfig = {
            issuer: 'exom',  // Ensure the issuer is correctly set
            authorization_endpoint: 'https://example.com/auth',
            token_endpoint: 'https://example.com/token',
            tokenURL: 'https://example.com/token',
            userInfoURL: 'https://example.com/userinfo',
            clientID: 'test-client-id',
            clientSecret: 'test-client-secret',
            callbackURL: 'https://example.com/callback',
            passReqToCallback: true,
            scope: 'openid profile email',  // Set required scopes
        };
        // Mock passport's use method to simulate adding the strategy
        passportMock.use.mockImplementation((strategy, callback) => {
                passportMock._callback = callback;
        });
        passportMock.register = jest.fn().mockResolvedValue(getProfileMock());

        // Instantiate the PassportOpenIDConnect class with the mock
        oidcInstance = new PassportOpenIDConnect(passportMock, oidcConfig);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch OIDC configuration', async () => {
        const fakeConfig = { issuer: 'exom', authorization_endpoint: 'https://example.com/auth' };
        fetch.mockResolvedValue({ json: jest.fn().mockResolvedValue(fakeConfig) });

        const result = await oidcInstance.getConfigFromConfigURL('test-provider', { OIDC_CONFIG_URL: 'https://example.com/.well-known/openid-configuration' });

        expect(fetch).toHaveBeenCalledWith('https://example.com/.well-known/openid-configuration');
        expect(result).toEqual(fakeConfig);
    });

    it('should throw AppError if fetching OIDC config fails', async () => {
        fetch.mockRejectedValue(new Error('Network error'));

        await expect(oidcInstance.getConfigFromConfigURL('test-provider', { OIDC_CONFIG_URL: 'https://example.com' }))
            .rejects.toThrow(AppError);
    });

    it('should register passport strategy and process new users consent flag true', async () => {    
        setupMocks(null, null, { 
          issuer: 'https://example.com', 
          authorization_endpoint: 'https://example.com/auth', 
          token_endpoint: 'https://example.com/token'
        });
        const profileMock = getProfileMock();

    
        const reqMock = { session: {} };
        const doneMock = jest.fn((error, user) => {
            console.log('doneMock was called:', error, user); // Log to check if doneMock is called
        });

        // Updated configuration with tokenURL
        const config = createOidcConfig();

        // Ensure `passportMock.use` is being called correctly with the expected config
        await oidcInstance.register(appMock, passportMock, '/auth', 'oidc-test', config, userModel);   


        // Check that passport.use has been called, which registers the strategy
        expect(passportMock.use).toHaveBeenCalledWith('oidc-test', expect.objectContaining({
            _issuer: 'https://example.com',  // Assert that tokenURL is present in the strategy config
        }));

        // Ensure routes are defined
        expect(appMock.get).toHaveBeenCalledWith('/auth/oidc-test', expect.any(Function));
        expect(appMock.get).toHaveBeenCalledWith('/auth/oidc-test/callback', expect.any(Function), expect.any(Function));

        // Access the _verify method inside the passportMock._callback (which is a Strategy instance)
        const strategyCallback = passportMock._callback._verify;

        // Ensure the callback is correctly registered and is a function
        expect(typeof strategyCallback).toBe('function');     
        
        doneMock.mockImplementation((error, user) => {
            // Check if session.requiresConsent is set
                console.log("In doneMock, error:", error, "user:", user);
        });

        // Simulate the strategy callback being invoked
        await strategyCallback(reqMock, null, profileMock, null, null, doneMock, null, userModel);

            // Ensure the doneMock was called
        expect(doneMock).toHaveBeenCalled();
        // Validate that consent flag is set for new users
        expect(reqMock.session.requiresConsent).toBe(true);
    });

    

    it('should correctly process new users and set consent flag', async () => {
        setupMocks(null, { _id: 'mocked-user-id', email: 'test@example.com' }, { 
          issuer: 'https://example.com', 
          authorization_endpoint: 'https://example.com/auth', 
          token_endpoint: 'https://example.com/token'
        });
        
        const config = createOidcConfig();
        const profileMock = getProfileMock();
    
        const reqMock = { session: {} };
        const doneMock = jest.fn((error, user) => {
            console.log('doneMock was called:', error, user);
        });
        passportMock.register.mockResolvedValue({ _id: 'new-user-id' });
        

        await oidcInstance.register(appMock, passportMock, '/auth', 'oidc-test', config, userModel);   

        const strategyCallback = passportMock._callback._verify;
        expect(typeof strategyCallback).toBe('function');     
        
        doneMock.mockImplementation((error, user) => {
                console.log("In doneMock, error:", error, "user:", user);
        });

        await strategyCallback(reqMock, null, profileMock, null, null, doneMock, null, userModel);

        expect(doneMock).toHaveBeenCalled();
        expect(reqMock.session.requiresConsent).toBe(true);
    });

    it('should correctly process existing users without setting consent flag', async () => {
        let linkData = {
          user_id: 'existing-user-id',
          provider_id: 'test-auth-id',
          provider: 'oidc',
          email: 'test@example.com',
          role: 'teacher',
        };

        setupMocks(linkData, { _id: 'mocked-user-id', email: 'test@example.com' }, { 
          issuer: 'https://example.com', 
          authorization_endpoint: 'https://example.com/auth', 
          token_endpoint: 'https://example.com/token'
        });

        const config = createOidcConfig();
        const profileMock = getProfileMock();
        const reqMock = { session: {} };
        const doneMock = jest.fn((error, user) => {
            console.log('doneMock was called:', error, user);
        }); 

        await oidcInstance.register(appMock, passportMock, '/auth', 'oidc-test', config, userModel);   
        
        const strategyCallback = passportMock._callback._verify;
        expect(typeof strategyCallback).toBe('function');     
        
        await strategyCallback(reqMock, null, profileMock, null, null, doneMock, null, userModel);

        expect(doneMock).toHaveBeenCalled();
        expect(reqMock.session.requiresConsent).toBe(false);
    });
});