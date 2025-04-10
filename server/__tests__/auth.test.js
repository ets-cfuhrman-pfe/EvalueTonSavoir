
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

    // Initialisez l'instance avec la configuration mockée
    beforeAll(() => {
      authConfigInstance = new AuthConfig();
      authConfigInstance.loadConfigTest(mockConfig); // On injecte la configuration mockée
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
    let authmanagerInstance;

    // Initialisez l'instance avec la configuration mockée
    beforeAll(() => {
      authConfigInstance = new AuthConfig();
    });

    it("should load valid modules", () => {
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
      authConfigInstance.loadConfigTest(validModule); // On injecte la configuration mockée
      // TODO new AuthManager(...) essaie d'établir une connexion MongoDB et ça laisse un "open handle" dans Jest 
      authmanagerInstance = new AuthManager(expressMock,authConfigInstance.config);
      authmanagerInstance.getUserModel();
      expect(logSpy).toHaveBeenCalledTimes(0);
      logSpy.mockClear();
    });

    it("should not load invalid modules", () => {
        const logSpy = jest.spyOn(global.console, "error");
        const invalidModule = {
          auth: {
            ModuleX:{}
          },
        };
        authConfigInstance.loadConfigTest(invalidModule); // On injecte la configuration mockée
        authmanagerInstance = new AuthManager(expressMock,authConfigInstance.config);
        expect(logSpy).toHaveBeenCalledTimes(1);
        logSpy.mockClear();
      });  


    it("should not load invalid provider from passport", () => {
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
        authConfigInstance.loadConfigTest(validModuleInvalidProvider); // On injecte la configuration mockée
        authmanagerInstance = new AuthManager(expressMock,authConfigInstance.config);
        expect(logSpy).toHaveBeenCalledTimes(4);
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
