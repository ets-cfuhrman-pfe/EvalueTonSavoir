const fs = require('fs');
const path = require('path');
const logger = require('./logger');
// set pathAuthConfig to './auth_config-development.json' if NODE_ENV is set to development
const pathAuthConfig = process.env.NODE_ENV === 'development' ? './auth_config-development.json' : './auth_config.json';

const configPath = path.join(process.cwd(), pathAuthConfig);

class AuthConfig {

  config = null;


  // Méthode pour lire le fichier de configuration JSON
  loadConfig() {
    try {
      logger.info(`Chargement du fichier de configuration: ${configPath}`, {
        configPath: configPath,
        environment: process.env.NODE_ENV,
        module: 'auth-config'
      });
      const configData = fs.readFileSync(configPath, 'utf-8');
      this.config = JSON.parse(configData);
    } catch (error) {
      logger.error("Erreur lors de la lecture du fichier de configuration. Ne pas se fier si vous n'avez pas mis de fichier de configuration.", {
        configPath: configPath,
        error: error.message,
        stack: error.stack,
        module: 'auth-config'
      });
      this.config = {};
      // In test environment, provide default config to allow tests to run
      if (process.env.NODE_ENV === 'test') {
        this.config = {
          auth: {
            simpleauth: {
              enabled: true,
              name: "test-provider",
              SESSION_SECRET: "test_session_secret"
            }
          }
        };
        return this.config;
      }
      throw error;
    }
    return this.config
  }

  // Méthode pour load le fichier de test
  loadConfigTest(mockConfig) {
    this.config = mockConfig;
  }

  // Méthode pour retourner la configuration des fournisseurs PassportJS
  getPassportJSConfig() {
    if (this.config && this.config.auth && this.config.auth.passportjs) {
      const passportConfig = {};

      this.config.auth.passportjs.forEach(provider => {
        const providerName = Object.keys(provider)[0];
        passportConfig[providerName] = provider[providerName];
      });

      return passportConfig;
    } else {
      return { error: "Aucune configuration PassportJS disponible." };
    }
  }

  // Méthode pour retourner la configuration de Simple Login
  getSimpleLoginConfig() {
    if (this.config && this.config.auth && this.config.auth["simpleauth"]) {
      return this.config.auth["simpleauth"];
    } else {
      return { error: "Aucune configuration Simple Login disponible." };
    }
  }

  // Méthode pour retourner tous les providers de type OAuth
  getOAuthProviders() {
    if (this.config && this.config.auth && this.config.auth.passportjs) {
      const oauthProviders = this.config.auth.passportjs.filter(provider => {
        const providerName = Object.keys(provider)[0];
        return provider[providerName].type === 'oauth';
      });

      if (oauthProviders.length > 0) {
        return oauthProviders;
      } else {
        return { error: "Aucun fournisseur OAuth disponible." };
      }
    } else {
      return { error: "Aucune configuration PassportJS disponible." };
    }
  }

  // Méthode pour retourner tous les providers de type OIDC
  getOIDCProviders() {
    if (this.config && this.config.auth && this.config.auth.passportjs) {
      const oidcProviders = this.config.auth.passportjs.filter(provider => {
        const providerName = Object.keys(provider)[0];
        return provider[providerName].type === 'oidc';
      });

      if (oidcProviders.length > 0) {
        return oidcProviders;
      } else {
        return { error: "Aucun fournisseur OIDC disponible." };
      }
    } else {
      return { error: "Aucune configuration PassportJS disponible." };
    }
  }

  // Méthode pour vérifier si tous les providers ont les variables nécessaires
  validateProvidersConfig() {
    const requiredOAuthFields = [
      'OAUTH_AUTHORIZATION_URL', 'OAUTH_TOKEN_URL','OAUTH_USERINFO_URL', 'OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET', 'OAUTH_ROLE_TEACHER_VALUE', 'OAUTH_ROLE_STUDENT_VALUE'
    ];

    const requiredOIDCFields = [
      'OIDC_CLIENT_ID', 'OIDC_CLIENT_SECRET', 'OIDC_CONFIG_URL', 'OIDC_ROLE_TEACHER_VALUE', 'OIDC_ROLE_STUDENT_VALUE','OIDC_ADD_SCOPE'
    ];

    const missingFieldsReport = [];

    if (this.config && this.config.auth && this.config.auth.passportjs) {
      this.config.auth.passportjs.forEach(provider => {
        const providerName = Object.keys(provider)[0];
        const providerConfig = provider[providerName];

        let missingFields = [];

        // Vérification des providers de type OAuth
        if (providerConfig.type === 'oauth') {
          missingFields = requiredOAuthFields.filter(field => !(field in providerConfig));
        }
        // Vérification des providers de type OIDC
        else if (providerConfig.type === 'oidc') {
          missingFields = requiredOIDCFields.filter(field => !(field in providerConfig));
        }

        // Si des champs manquent, on les ajoute au rapport
        if (missingFields.length > 0) {
          missingFieldsReport.push({
            provider: providerName,
            missingFields: missingFields
          });
        }
      });

      // Si des champs manquent, lever une exception
      if (missingFieldsReport.length > 0) {
        throw new Error(`Configuration invalide pour les providers suivants : ${JSON.stringify(missingFieldsReport, null, 2)}`);
      } else {
        logger.info("Configuration auth_config.json: Tous les providers ont les variables nécessaires.", {
          module: 'auth-config',
          validation: 'success'
        })
        return { success: "Tous les providers ont les variables nécessaires." };
      }
    } else {
      throw new Error("Aucune configuration PassportJS disponible.");
    }
  }

  // Méthode pour retourner la configuration des fournisseurs PassportJS pour le frontend
  getActiveAuth() {
    // Log only non-sensitive metadata: provider names and types
    const providerSummary = (this.config && this.config.auth && this.config.auth.passportjs)
      ? this.config.auth.passportjs.map(provider => {
          const providerName = Object.keys(provider)[0];
          const providerConfig = provider[providerName];
          return { provider: providerName, type: providerConfig.type };
        })
      : [];
    logger.debug('Getting active auth configuration', {
      providers: providerSummary,
      module: 'auth-config'
    });
    if (this.config && this.config.auth) {
      const passportConfig = {};

      // Gestion des providers PassportJS
      if (this.config.auth.passportjs) {
        this.config.auth.passportjs.forEach(provider => {
          const providerName = Object.keys(provider)[0];
          const providerConfig = provider[providerName];

          passportConfig[providerName] = {};

          if (providerConfig.type === 'oauth') {
            passportConfig[providerName] = {
              type: providerConfig.type
            };
          } else if (providerConfig.type === 'oidc') {
            passportConfig[providerName] = {
              type: providerConfig.type,
            };
          }
        });
      }

      // Gestion du Simple Login
      if (this.config.auth["simpleauth"] && this.config.auth["simpleauth"].enabled) {
        passportConfig['simpleauth'] = {
          type: "simpleauth",
          name: this.config.auth["simpleauth"].name
        };
      }

      return passportConfig;
    } else {
      return { error: "Aucune configuration d'authentification disponible." };
    }
  }

  // Check if students must be authenticated to join a room
  getRoomsRequireAuth() {
    const roomRequireAuth = process.env.AUTHENTICATED_ROOMS;

    if (!roomRequireAuth || roomRequireAuth !== "true") {
      return false;
    }

    return true;
  }


}

module.exports = AuthConfig;
