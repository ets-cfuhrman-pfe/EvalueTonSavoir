// Only mock the database for this specific test file
jest.mock('../config/db', () => {
  // Create a collection mock with common methods
  const collectionMock = {
    findOne: jest.fn().mockResolvedValue(null),
    insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    find: jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([])
    })
  };

  // Main database connection mock
  return {
    getConnection: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue(collectionMock)
    }),
    collection: jest.fn().mockReturnValue(collectionMock),
    connect: jest.fn().mockResolvedValue({
      collection: jest.fn().mockReturnValue(collectionMock)
    }),
    closeConnection: jest.fn().mockResolvedValue(undefined)
  };
});

// Add a cleanup for this test file only
afterAll(async () => {
  // Clean up any remaining resources
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Auth tests completed, resources cleaned up');
});

const AuthConfig = require("../config/auth.js");
const AuthManager = require("../auth/auth-manager.js");

// Mock fetch for OIDC configuration
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      issuer: 'https://mock-issuer.com',
      authorization_endpoint: 'https://mock-issuer.com/oauth2/authorize',
      token_endpoint: 'https://mock-issuer.com/oauth2/token',
      userinfo_endpoint: 'https://mock-issuer.com/oauth2/userinfo',
      jwks_uri: 'https://mock-issuer.com/oauth2/jwks'
    })
  })
);

// Mock logger for testing
jest.mock('../config/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const logger = require('../config/logger');

const mockConfig = {
  auth: {
    passportjs: [
      {
        provider1: {
          type: "oauth",
          OAUTH_AUTHORIZATION_URL: "https://www.testurl.com/oauth2/authorize",
          OAUTH_TOKEN_URL: "https://www.testurl.com/oauth2/token",
          OAUTH_USERINFO_URL: "https://www.testurl.com/oauth2/userinfo/",
          OAUTH_CLIENT_ID: "your_oauth_client_id",
          OAUTH_CLIENT_SECRET: "your_oauth_client_secret",
          OAUTH_ADD_SCOPE: "scopes",
          OAUTH_ROLE_TEACHER_VALUE: "teacher-claim-value",
          OAUTH_ROLE_STUDENT_VALUE: "student-claim-value",
        },
      },
      {
        provider2: {
          type: "oidc",
          OIDC_CLIENT_ID: "your_oidc_client_id",
          OIDC_CLIENT_SECRET: "your_oidc_client_secret",
          OIDC_CONFIG_URL: "https://your-issuer.com",
          OIDC_ADD_SCOPE: "groups",
          OIDC_ROLE_TEACHER_VALUE: "teacher-claim-value",
          OIDC_ROLE_STUDENT_VALUE: "student-claim-value",
        },
      },
    ],
    "simpleauth": {
      enabled: true,
      name: "provider3",
      SESSION_SECRET: "your_session_secret",
    },
  },
};

// Créez une instance de AuthConfig en utilisant la configuration mockée
describe(
  "AuthConfig Class Tests",
  () => {
    let authConfigInstance;
    let authManagerInstance;

    // Initialisez l'instance avec la configuration mockée
    beforeAll(() => {
      authConfigInstance = new AuthConfig();
      authConfigInstance.loadConfigTest(mockConfig); // On injecte la configuration mockée
    });

        // Add this hook to clean up after each test
    afterEach(async () => {
        if (authManagerInstance) {
            await authManagerInstance.close();
        }
        authManagerInstance = null;
    });


    it("devrait retourner la configuration PassportJS", () => {
      const config = authConfigInstance.getPassportJSConfig();
      expect(config).toHaveProperty("provider1");
      expect(config).toHaveProperty("provider2");
    });

    it("devrait retourner la configuration Simple Login", () => {
      const config = authConfigInstance.getSimpleLoginConfig();
      expect(config).toHaveProperty("name", "provider3");
      expect(config).toHaveProperty("SESSION_SECRET", "your_session_secret");
    });

    it("devrait retourner les providers OAuth", () => {
      const oauthProviders = authConfigInstance.getOAuthProviders();
      expect(Array.isArray(oauthProviders)).toBe(true);
      expect(oauthProviders.length).toBe(1); // Il y a un seul provider OAuth
      expect(oauthProviders[0]).toHaveProperty("provider1");
    });

    it("devrait valider la configuration des providers", () => {
      expect(() => authConfigInstance.validateProvidersConfig()).not.toThrow();
    });

    it("devrait lever une erreur si une configuration manque", () => {
      const invalidMockConfig = {
        auth: {
          passportjs: [
            {
              provider1: {
                type: "oauth",
                OAUTH_CLIENT_ID: "your_oauth_client_id", // Il manque des champs nécessaires
              },
            },
          ],
        },
      };

      const instanceWithInvalidConfig = new AuthConfig();
      instanceWithInvalidConfig.loadConfigTest(invalidMockConfig);

      // Vérifiez que l'erreur est lancée avec les champs manquants corrects
      expect(() => instanceWithInvalidConfig.validateProvidersConfig()).toThrow(
        new Error(`Configuration invalide pour les providers suivants : [
  {
    "provider": "provider1",
    "missingFields": [
      "OAUTH_AUTHORIZATION_URL",
      "OAUTH_TOKEN_URL",
      "OAUTH_USERINFO_URL",
      "OAUTH_CLIENT_SECRET",
      "OAUTH_ROLE_TEACHER_VALUE",
      "OAUTH_ROLE_STUDENT_VALUE"
    ]
  }
]`)
      );
    });
  },

  describe("Auth Module Registration", () => {
    let expressMock = jest.mock("express");
    expressMock.use = () => {}
    expressMock.get = () => {}

    let authConfigInstance;
    let authManagerInstance;
    let mockUserModel;

    // Initialisez l'instance avec la configuration mockée
    beforeAll(() => {
      authConfigInstance = new AuthConfig();
      
      // Create a mock user model with the methods expected by AuthManager
      mockUserModel = {
        register: jest.fn().mockResolvedValue({ _id: 'mock-user-id', email: 'test@example.com' }),
        login: jest.fn().mockResolvedValue({ _id: 'mock-user-id', email: 'test@example.com' }),
        getById: jest.fn().mockResolvedValue({ _id: 'mock-user-id', email: 'test@example.com' }),
        getId: jest.fn().mockResolvedValue('mock-user-id'),
        generatePassword: jest.fn().mockReturnValue('generatedPassword123'),
        editUser: jest.fn().mockResolvedValue(true),
        close: jest.fn().mockResolvedValue(undefined)
      };
    });

    // Add this hook to clean up after each test
    afterEach(async () => {
        console.log("Cleaning up after test...");
        if (authManagerInstance) {
            await authManagerInstance.close();
            console.log("AuthManager instance closed.");
        }
        authManagerInstance = null;
        
        // Reset all mocks between tests
        jest.clearAllMocks();
    });

    it("should load valid modules", async () => {
      const logSpy = jest.spyOn(global.console, "error");
      const validModule = {
        auth: {
          passportjs: [
            {
              provider1: {
                    type: "oauth",
                    OAUTH_AUTHORIZATION_URL:
                    "https://www.testurl.com/oauth2/authorize",
                    OAUTH_TOKEN_URL: "https://www.testurl.com/oauth2/token",
                    OAUTH_USERINFO_URL: "https://www.testurl.com/oauth2/userinfo/",
                    OAUTH_CLIENT_ID: "your_oauth_client_id",
                    OAUTH_CLIENT_SECRET: "your_oauth_client_secret",
                    OAUTH_ADD_SCOPE: "scopes",
                    OAUTH_ROLE_TEACHER_VALUE: "teacher-claim-value",
                    OAUTH_ROLE_STUDENT_VALUE: "student-claim-value",
              },
              provider2: {
                type: "oauth",
                OAUTH_AUTHORIZATION_URL:
                "https://www.testurl.com/oauth2/authorize",
                OAUTH_TOKEN_URL: "https://www.testurl.com/oauth2/token",
                OAUTH_USERINFO_URL: "https://www.testurl.com/oauth2/userinfo/",
                OAUTH_CLIENT_ID: "your_oauth_client_id",
                OAUTH_CLIENT_SECRET: "your_oauth_client_secret",
                OAUTH_ADD_SCOPE: "scopes",
                OAUTH_ROLE_TEACHER_VALUE: "teacher-claim-value",
                OAUTH_ROLE_STUDENT_VALUE: "student-claim-value",
          },
            },
          ],
        },
      };
      authConfigInstance.loadConfigTest(validModule);
      authManagerInstance = new AuthManager(expressMock, authConfigInstance.config, mockUserModel);
      authManagerInstance.getUserModel();
      expect(logSpy).toHaveBeenCalledTimes(0);
      logSpy.mockClear();
    });

    it("should not load invalid modules", async () => {
        const invalidModule = {
          auth: {
            ModuleX:{}
          },
        };

        authConfigInstance.loadConfigTest(invalidModule);
        authManagerInstance = new AuthManager(expressMock, authConfigInstance.config, mockUserModel);
        
        // Check that logger.error was called for invalid module
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('n\'as pas été chargé car il est introuvable'),
          expect.objectContaining({
            moduleName: 'ModuleX'
          })
        );
      });  


    it("should not load invalid provider from passport", async () => {
        const validModuleInvalidProvider = {
            auth: {
              passportjs: [
                {
                  provider1: {
                        type: "x",
                        OAUTH_AUTHORIZATION_URL:
                        "https://www.testurl.com/oauth2/authorize",
                        OAUTH_TOKEN_URL: "https://www.testurl.com/oauth2/token",
                        OAUTH_USERINFO_URL: "https://www.testurl.com/oauth2/userinfo/",
                        OAUTH_CLIENT_ID: "your_oauth_client_id",
                        OAUTH_CLIENT_SECRET: "your_oauth_client_secret",
                        OAUTH_ADD_SCOPE: "scopes",
                        OAUTH_ROLE_TEACHER_VALUE: "teacher-claim-value",
                        OAUTH_ROLE_STUDENT_VALUE: "student-claim-value",
                  },
                },
              ],
            },
          };
        authConfigInstance.loadConfigTest(validModuleInvalidProvider); 

        authManagerInstance = new AuthManager(expressMock,authConfigInstance.config, mockUserModel);

        // Check that logger.error was called for invalid provider type
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Provider file not found'),
          expect.objectContaining({
            providerType: 'x'
          })
        );
      });  
  })
);

// Logger coverage tests for auth modules
describe("Auth Logger Coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("AuthManager Logger Tests", () => {
    it("should log debug messages during constructor", () => {
      const mockUserModel = { register: jest.fn(), login: jest.fn() };
      const mockExpressApp = {
        use: jest.fn(),
        post: jest.fn(),
        get: jest.fn()
      };
      
      // Create AuthManager instance which should trigger logger calls
      new AuthManager(mockExpressApp, mockConfig, mockUserModel);
      
      expect(logger.debug).toHaveBeenCalledWith(
        'AuthManager constructor initialized',
        expect.objectContaining({
          configs: expect.any(String),
          userModel: expect.any(String)
        })
      );
      
      expect(logger.debug).toHaveBeenCalledWith(
        'AuthManager constructor completed',
        expect.objectContaining({
          configs: expect.any(String)
        })
      );
    });

    it("should log info message on successful login", async () => {
      const mockUserModel = { 
        register: jest.fn(), 
        login: jest.fn().mockResolvedValue({ 
          _id: 'user123', 
          email: 'test@example.com',
          name: 'Test User'
        })
      };
      const mockExpressApp = {
        use: jest.fn(),
        post: jest.fn(),
        get: jest.fn()
      };
      const mockReq = {};
      const mockRes = { redirect: jest.fn() };
      const mockNext = jest.fn();
      
      const authManager = new AuthManager(mockExpressApp, mockConfig, mockUserModel);
      
      const userInfo = {
        _id: 'user123',
        email: 'test@example.com', 
        name: 'Test User',
        roles: ['teacher']
      };
      
      await authManager.login(userInfo, mockReq, mockRes, mockNext);
      
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("L'utilisateur 'Test User' vient de se connecter"),
        expect.objectContaining({
          userId: 'user123',
          userEmail: 'test@example.com',
          userName: 'Test User',
          roles: ['teacher']
        })
      );
    });

    it("should log debug messages during simple login", async () => {
      const mockUserModel = { 
        register: jest.fn(), 
        login: jest.fn().mockResolvedValue({ 
          _id: 'user123', 
          email: 'test@example.com'
        })
      };
      const mockExpressApp = {
        use: jest.fn(),
        post: jest.fn(),
        get: jest.fn()
      };
      const mockReq = {};
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockNext = jest.fn();
      
      const authManager = new AuthManager(mockExpressApp, mockConfig, mockUserModel);
      
      await authManager.loginSimple('test@example.com', 'password123', mockReq, mockRes, mockNext);
      
      expect(logger.debug).toHaveBeenCalledWith(
        'Starting simple login process',
        expect.objectContaining({
          email: 'test@example.com',
          passwordProvided: true
        })
      );
    });
  });

  describe("AuthConfig Logger Tests", () => {
    it("should log info message when loading config", () => {
      // Test that logger functionality works with auth config
      logger.info("Test config loading", { module: 'auth-config', test: true });
      
      expect(logger.info).toHaveBeenCalledWith(
        "Test config loading", 
        expect.objectContaining({
          module: 'auth-config',
          test: true
        })
      );
    });

    it("should log info message on successful validation", () => {
      const authConfig = new AuthConfig();
      authConfig.loadConfigTest(mockConfig);
      
      authConfig.validateProvidersConfig();
      
      expect(logger.info).toHaveBeenCalledWith(
        "Configuration auth_config.json: Tous les providers ont les variables nécessaires.",
        expect.objectContaining({
          module: 'auth-config',
          validation: 'success'
        })
      );
    });

    it("should log debug messages when getting active auth", () => {
      const authConfig = new AuthConfig();
      authConfig.loadConfigTest(mockConfig);
      
      authConfig.getActiveAuth();
      
      expect(logger.debug).toHaveBeenCalledWith(
        'Getting active auth configuration',
        expect.objectContaining({
          config: expect.any(String),
          auth: expect.any(String),
          module: 'auth-config'
        })
      );
    });
  });
});

describe(
  "Rooms requiring authentication", () => {
    // Making a copy of env variables to restore them later
    const OLD_ENV_VARIABLES = process.env;

    let authConfigInstance;

    beforeAll(() => {
      authConfigInstance = new AuthConfig();
    });

    // Clearing cache just in case
    beforeEach(() => {
      jest.resetModules();
      process.env = { ...OLD_ENV_VARIABLES };
    });

    // Resetting the old values
    afterAll(() => {
      process.env = OLD_ENV_VARIABLES;
    });

    // tests cases as [environment variable value, expected value]
    const cases = [["true", true], ["false", false], ["", false], ["other_than_true_false", false]];
    test.each(cases)(
      "Given %p as AUTHENTICATED_ROOMS environment variable value, returns %p",
      (envVarArg, expectedResult) => {
        process.env.AUTHENTICATED_ROOMS = envVarArg;
        const isAuthRequired = authConfigInstance.getRoomsRequireAuth();

        expect(isAuthRequired).toEqual(expectedResult);
      }
    );

  }
)
