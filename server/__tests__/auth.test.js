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

    // Initialisez l'instance avec la configuration mockée
    beforeAll(() => {
      authConfigInstance = new AuthConfig();
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
      authManagerInstance = new AuthManager(expressMock, authConfigInstance.config);
      authManagerInstance.getUserModel();
      expect(logSpy).toHaveBeenCalledTimes(0);
      logSpy.mockClear();
    });

    it("should not load invalid modules", async () => {
        const logSpy = jest.spyOn(global.console, "error");
        const invalidModule = {
          auth: {
            ModuleX:{}
          },
        };

        authConfigInstance.loadConfigTest(invalidModule);
        authManagerInstance = new AuthManager(expressMock, authConfigInstance.config);
        expect(logSpy).toHaveBeenCalledTimes(1);
        logSpy.mockClear();
      });  


    it("should not load invalid provider from passport", async () => {
        const logSpy = jest.spyOn(global.console, "error");
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

        authManagerInstance = new AuthManager(expressMock,authConfigInstance.config);

        expect(logSpy).toHaveBeenCalledTimes(2);
        logSpy.mockClear();
      });  
  })
);

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
