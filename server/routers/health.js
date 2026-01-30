const express = require('express');
const router = express.Router();
const db = require('../config/db');
const AuthConfig = require('../config/auth');
const http = require('http');
const https = require('https');
const asyncHandler = require('./routerUtils');
const healthFlags = require('../utils/healthFlags');
const logger = require('../config/logger');

const rateLimit = require('express-rate-limit');

// Apply rate limit: 50 requests per 1 minute
const healthLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50,
    message: {
        status: 'error',
        message: 'Too many requests. Please wait a moment.'
    }
});
router.use(healthLimiter);

// Cache auth config to avoid blocking fs.readFileSync on every health check
let cachedAuthProvidersConfig = null;
let lastConfigLoad = 0;
const CONFIG_CACHE_MS = 60000; // Cache for 1 minute

const getCachedAuthProviders = () => {
    const now = Date.now();
    if (!cachedAuthProvidersConfig || (now - lastConfigLoad > CONFIG_CACHE_MS)) {
        try {
            const authConfig = new AuthConfig().loadConfig();
            const checks = [];

            // Navigate structure to find OIDC_CONFIG_URL
            if (authConfig && authConfig.auth && Array.isArray(authConfig.auth.passportjs)) {
                authConfig.auth.passportjs.forEach(providerGroup => {
                    Object.keys(providerGroup).forEach(key => {
                        const config = providerGroup[key];
                        if (config && config.OIDC_CONFIG_URL) {
                            checks.push({
                                name: key,
                                url: config.OIDC_CONFIG_URL
                            });
                        }
                    });
                });
            }
            
            cachedAuthProvidersConfig = checks;
            lastConfigLoad = now;
        } catch (_e) {
            // If config fails to load, return cached value or empty array,
            // and back off further load attempts for CONFIG_CACHE_MS.
            if (logger && typeof logger.error === 'function') {
                logger.error('Failed to load auth config in health check; using cached value if available.', _e);
            }
            if (!cachedAuthProvidersConfig) {
                cachedAuthProvidersConfig = [];
            }
            lastConfigLoad = now;
        }
    }
    return cachedAuthProvidersConfig;
};

// Initialize cache at module load to avoid blocking during first health check
getCachedAuthProviders();

// Export for testing - allows tests to reset the cache
const resetAuthProvidersCache = () => {
    cachedAuthProvidersConfig = null;
    lastConfigLoad = 0;
};

// Helper to sanitize error details for external exposure
const sanitizeError = (errorDetails, context) => {
    // Log detailed error server-side
    logger.warn('Health check failure', {
        context,
        details: errorDetails,
        module: 'health-router'
    });
    
    if (process.env.NODE_ENV === 'development') {
        // Return full details in development with consistent shape
        return {
            message: typeof errorDetails === 'string' ? errorDetails : (errorDetails?.message || 'Unknown error'),
            details: errorDetails
        };
    }
    
    // Return generic message to client in consistent shape
    return { message: 'Service unavailable' };
};

// Helper to sanitize auth provider details for external exposure
const sanitizeAuthProviderDetails = (details) => {
    if (!details) return null;
    
    if (process.env.NODE_ENV === 'development') {
        // Return full details in development
        return details;
    }
    
    // Log detailed provider status server-side
    logger.info('Auth provider health check', {
        details,
        module: 'health-router'
    });
    
    // In production, only return generic up/down status without error details
    const sanitized = {};
    Object.keys(details).forEach(provider => {
        sanitized[provider] = details[provider] === 'up' ? 'up' : 'down';
    });
    return sanitized;
};

// Helper to check DB connection
const checkDB = async () => {
    try {
        const connection = db.getConnection();
        await connection.command({ ping: 1 });
        return { ok: true, code: 200 };
    } catch (e) {
        return { ok: false, error: e.message, code: 503 };
    }
};

// Helper to check Auth Providers
const checkAuthProviders = async () => {
    try {
        const checks = getCachedAuthProviders();

        if (checks.length === 0) {
            // No OIDC providers configured to check
            return { ok: true };
        }

        const results = await Promise.all(checks.map(async (check) => {
            return new Promise((resolve) => {
                try {
                    const lib = check.url.startsWith('https') ? https : http;
                    const req = lib.get(check.url, { timeout: 5000 }, (res) => {
                         // 200-299 is success for discovery
                         if (res.statusCode >= 200 && res.statusCode < 300) {
                             resolve({ ok: true, name: check.name });
                         } else {
                             resolve({ ok: false, name: check.name, error: `Status ${res.statusCode}` });
                         }
                         res.resume();
                    });
                    
                    req.on('error', (err) => {
                         resolve({ ok: false, name: check.name, error: err.message });
                    });

                    req.on('timeout', () => {
                        req.destroy();
                        resolve({ ok: false, name: check.name, error: 'Timeout' });
                    });
                } catch (err) {
                    // Handle synchronous errors (e.g., invalid URL)
                    resolve({ ok: false, name: check.name, error: err.message });
                }
            });
        }));

        const allOk = results.every(r => r.ok);
        const details = {};
        results.forEach(r => details[r.name] = r.ok ? 'up' : r.error);
        
        return { ok: allOk, details, code: allOk ? 200 : 503 };

    } catch (e) {
        // If config fails to load entirely
        return { ok: false, error: e.message, code: 503 };
    }
};

// Helper to check collection access

const checkCollection = async (collectionName) => {
    try {
        const connection = db.getConnection();
        // count 1 document to verify access
        await connection.collection(collectionName).findOne({}, { projection: { _id: 1 } });
        return { ok: true, code: 200 };
    } catch (e) {
        return { ok: false, error: e.message, code: 503 };
    }
};

router.get('/', asyncHandler(async (req, res) => {
    const dbCheck = await checkDB();
    const authCheck = await checkAuthProviders();
    const authLoginCheck = healthFlags.getAuthLoginStatus();

    const services = {
        database: dbCheck.ok ? 'up' : 'down',
        server: 'up'
    };

    if (authCheck.details || !authCheck.ok || !authLoginCheck.ok) {
        services.auth = authCheck.ok && authLoginCheck.ok ? 'up' : 'down';
    }

    const sanitizedAuthProviders = sanitizeAuthProviderDetails(authCheck.details);
    
    const response = {
        status: dbCheck.ok && (authCheck.ok !== false) && authLoginCheck.ok ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        services,
        checks: {
            ...(sanitizedAuthProviders && { auth_providers: sanitizedAuthProviders }),
            auth_login: authLoginCheck.ok ? 'ok' : 'failed'
        }
    };
    
    if (!dbCheck.ok || !authCheck.ok || !authLoginCheck.ok) {
        response.errors = {};
        if (!dbCheck.ok) response.errors.database = sanitizeError(dbCheck.error, 'database');
        if (!authCheck.ok) response.errors.auth = sanitizeError(authCheck.details || authCheck.error, 'auth_providers');
        if (!authLoginCheck.ok) response.errors.auth_login = sanitizeError(authLoginCheck.error, 'auth_login');
        return res.status(503).json(response);
    }
    
    res.json(response);
}));

// Check dependencies for /teacher/dashboard-v2
router.get('/dashboard', asyncHandler(async (req, res) => {

    const quizzesCheck = await checkCollection('quizzes');
 
    const foldersCheck = await checkCollection('folders');
    
    const status = quizzesCheck.ok && foldersCheck.ok ? 'ok' : 'error';
    const response = {
        status,
        timestamp: new Date().toISOString(),
        checks: {
            quizzes: quizzesCheck.ok ? 'ok' : 'failed',
            folders: foldersCheck.ok ? 'ok' : 'failed'
        }
    };

    if (!quizzesCheck.ok || !foldersCheck.ok) {
        response.errors = {};
        if (!quizzesCheck.ok) response.errors.quizzes = sanitizeError(quizzesCheck.error, 'quizzes_collection');
        if (!foldersCheck.ok) response.errors.folders = sanitizeError(foldersCheck.error, 'folders_collection');
        return res.status(503).json(response);
    }

    res.json(response);
}));

// Check dependencies for /login
router.get('/login', asyncHandler(async (req, res) => {
    const usersCheck = await checkCollection('users');
    
    const response = {
        status: usersCheck.ok ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        checks: {
            users_collection: usersCheck.ok ? 'ok' : 'failed'
        }
    };

    if (!usersCheck.ok) {
        response.errors = { users_collection: sanitizeError(usersCheck.error, 'users_collection') };
        return res.status(503).json(response);
    }
    
    res.json(response);
}));

// Check authentication login health flag only
router.get('/auth-login', asyncHandler(async (req, res) => {
    const authLoginCheck = healthFlags.getAuthLoginStatus();

    const response = {
        status: authLoginCheck.ok ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        checks: {
            auth_login: authLoginCheck.ok ? 'ok' : 'failed'
        }
    };

    if (!authLoginCheck.ok) {
        response.errors = { auth_login: sanitizeError(authLoginCheck.error, 'auth_login_flag') };
        return res.status(503).json(response);
    }

    res.json(response);
}));

// Check dependencies for /student/join-room-v2
router.get('/join-room', asyncHandler(async (req, res) => {
    const roomsCheck = await checkCollection('rooms');
    
    const response = {
        status: roomsCheck.ok ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        checks: {
            rooms_collection: roomsCheck.ok ? 'ok' : 'failed'
        }
    };

    if (!roomsCheck.ok) {
        response.errors = { rooms_collection: sanitizeError(roomsCheck.error, 'rooms_collection') };
        return res.status(503).json(response);
    }
    
    res.json(response);
}));

module.exports = router;

// Export reset function for testing
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    module.exports.resetAuthProvidersCache = resetAuthProvidersCache;
}
