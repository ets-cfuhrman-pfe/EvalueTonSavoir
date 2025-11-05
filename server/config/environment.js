/**
 * Environment Configuration
 * 
 * Centralized environment configuration that validates and provides defaults
 * for all environment variables
 */

const logger = require('./logger');

class EnvironmentConfig {
  constructor() {
    this.config = this.loadAndValidateConfig();
  }

  loadAndValidateConfig() {
    // Normalize NODE_ENV to standard values
    const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
    const environment = nodeEnv === 'dev' ? 'development' : nodeEnv;
    
    // Validate NODE_ENV
    if (!['development', 'production', 'test'].includes(environment)) {
      throw new Error(`Invalid NODE_ENV: ${environment}. Must be 'development', 'production', or 'test'`);
    }

    const isDevelopment = environment === 'development';
    const isProduction = environment === 'production';
    const isTest = environment === 'test';

    const config = {
      // Environment
      NODE_ENV: environment,
      isDevelopment,
      isProduction,
      isTest,

      // Server
      PORT: this.getNumber('PORT', 4400),
      
      // URLs (computed, not from env)
      SITE_URL: process.env.SITE_URL || 'http://localhost',
      USE_PORTS: this.getBoolean('USE_PORTS', isDevelopment),
      
      // Database
      MONGO_URI: this.getRequired('MONGO_URI', 'mongodb://localhost:27017'),
      MONGO_DATABASE: this.getRequired('MONGO_DATABASE', 'evaluetonsavoir'),
      
      // Authentication
      JWT_SECRET: this.getRequired('JWT_SECRET', isDevelopment ? 'dev-jwt-secret' : null),
      SESSION_SECRET: this.getRequired(['SESSION_SECRET', 'SESSION_Secret'], isDevelopment ? 'dev-session-secret' : null),
      AUTHENTICATED_ROOMS: this.getBoolean('AUTHENTICATED_ROOMS', false),
      
      // Email (optional in development)
      EMAIL_SERVICE: process.env.EMAIL_SERVICE || (isDevelopment ? 'gmail' : null),
      SENDER_EMAIL: process.env.SENDER_EMAIL || null,
      EMAIL_PSW: process.env.EMAIL_PSW || null,
      
      // OAuth/OIDC URLs (for auth config)
      OIDC_URL: process.env.OIDC_URL || null,
    };

    // Compute derived URLs
    const frontendPort = this.getNumber('FRONTEND_PORT', 5173);
    const backendPort = config.PORT;
    
    config.FRONTEND_URL = config.SITE_URL + (config.USE_PORTS ? `:${frontendPort}` : '');
    config.BACKEND_URL = config.SITE_URL + (config.USE_PORTS ? `:${backendPort}` : '');
    config.FRONTEND_PORT = frontendPort;

    // Validate production requirements
    if (isProduction) {
      this.validateProductionConfig(config);
    }

    return config;
  }

  getRequired(key, devDefault = null) {
    // Support checking multiple key variants (for backwards compatibility)
    const keys = Array.isArray(key) ? key : [key];
    
    for (const k of keys) {
      const value = process.env[k];
      if (value) return value;
    }
    
    if (devDefault && this.isDevelopment()) {
      return devDefault;
    }
    
    const keyStr = Array.isArray(key) ? key.join(' or ') : key;
    throw new Error(`Required environment variable ${keyStr} is not set`);
  }

  getBoolean(key, defaultValue = false) {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  getNumber(key, defaultValue) {
    const value = process.env[key];
    if (!value) return defaultValue;
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
    }
    return num;
  }

  isDevelopment() {
    return (process.env.NODE_ENV || 'development').toLowerCase() === 'development';
  }

  validateProductionConfig(config) {
    const required = ['JWT_SECRET', 'SESSION_SECRET', 'MONGO_URI'];
    const missing = required.filter(key => !config[key] || config[key].includes('dev-'));
    
    if (missing.length > 0) {
      throw new Error(`Production environment requires these variables: ${missing.join(', ')}`);
    }

    // Warn about email config
    if (!config.EMAIL_SERVICE || !config.SENDER_EMAIL || !config.EMAIL_PSW) {
      logger.warn('Email configuration incomplete - email features will not work');
    }
  }

  // Get a config value
  get(key) {
    return this.config[key];
  }

  // Get all config (for debugging)
  getAll() {
    // Return copy without sensitive data
    const safe = { ...this.config };
    delete safe.JWT_SECRET;
    delete safe.SESSION_SECRET;
    delete safe.EMAIL_PSW;
    return safe;
  }

  // Log configuration summary
  logConfig() {
    logger.info('Environment configuration loaded', {
      environment: this.config.NODE_ENV,
      port: this.config.PORT,
      database: this.config.MONGO_DATABASE,
      usesPorts: this.config.USE_PORTS,
      authRoomsRequired: this.config.AUTHENTICATED_ROOMS,
      emailConfigured: !!(this.config.EMAIL_SERVICE && this.config.SENDER_EMAIL),
      urls: {
        frontend: this.config.FRONTEND_URL,
        backend: this.config.BACKEND_URL
      }
    });
  }
}

// Export singleton instance
const envConfig = new EnvironmentConfig();
module.exports = envConfig;