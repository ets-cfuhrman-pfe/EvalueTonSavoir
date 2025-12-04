const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('./routerUtils');

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
    const response = {
        status: dbCheck.ok ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        services: {
            database: dbCheck.ok ? 'up' : 'down',
            server: 'up'
        }
    };
    
    if (!dbCheck.ok) {
        response.errors = { database: dbCheck.error };
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
        if (!quizzesCheck.ok) response.errors.quizzes = quizzesCheck.error;
        if (!foldersCheck.ok) response.errors.folders = foldersCheck.error;
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
        response.errors = { users_collection: usersCheck.error };
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
        response.errors = { rooms_collection: roomsCheck.error };
        return res.status(503).json(response);
    }
    
    res.json(response);
}));

module.exports = router;
