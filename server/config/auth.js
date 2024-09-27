const fs = require('fs');
const path = require('path');
const pathAuthConfig = './auth_config.json';

const configPath = path.join(__dirname, pathAuthConfig);

class AuthConfig {

  config = null;


  // Méthode pour lire le fichier de configuration JSON
  loadConfig() {
    try {
      const configData = fs.readFileSync(configPath, 'utf-8');
      this.config = JSON.parse(configData);
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier de configuration :", error);
      return null;
    }
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
    if (this.config && this.config.auth && this.config.auth["simple-login"]) {
      return this.config.auth["simple-login"];
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
      'OAUTH_AUTHORIZATION_URL', 'OAUTH_TOKEN_URL', 'OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET', 'OAUTH_CALLBACK_URL'
    ];

    const requiredOIDCFields = [
      'OIDC_CLIENT_ID', 'OIDC_CLIENT_SECRET', 'OIDC_ISSUER_URL', 'OIDC_CALLBACK_URL'
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
        console.log("Configuration auth_config.json: Tous les providers ont les variables nécessaires.")
        return { success: "Tous les providers ont les variables nécessaires." };
      }
    } else {
      throw new Error("Aucune configuration PassportJS disponible.");
    }
  }

  // Méthode pour retourner la configuration des fournisseurs PassportJS pour le frontend
  getActiveAuth() {
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
              type: providerConfig.type,
              authorizationUrl: providerConfig.OAUTH_AUTHORIZATION_URL,
              callbackUrl: providerConfig.OAUTH_CALLBACK_URL,
            };
          } else if (providerConfig.type === 'oidc') {
            passportConfig[providerName] = {
              type: providerConfig.type,
              issuerUrl: providerConfig.OIDC_ISSUER_URL,
              callbackUrl: providerConfig.OIDC_CALLBACK_URL
            };
          }
        });
      }

      // Gestion du Simple Login
      if (this.config.auth["simple-login"] && this.config.auth["simple-login"].enabled) {
        passportConfig['simple-login'] = {
          type: "simple-login",
          name: this.config.auth["simple-login"].name
        };
      }

      return passportConfig;
    } else {
      return { error: "Aucune configuration d'authentification disponible." };
    }
  }


}

module.exports = AuthConfig;
