const express = require('express');
const router = express.Router();
const db = require('../config/db');

//rate limiter
const rateLimit = (windowMs, max) => {
    const requests = new Map();
    
    // Clean up old entries every minute to prevent memory leaks
    setInterval(() => {
        const now = Date.now();
        for (const [ip, data] of requests.entries()) {
            if (now - data.startTime > windowMs) {
                requests.delete(ip);
            }
        }
    }, 60000);

    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        
        if (!requests.has(ip)) {
            requests.set(ip, { count: 1, startTime: now });
            return next();
        }

        const data = requests.get(ip);
        
        if (now - data.startTime > windowMs) {
            data.count = 1;
            data.startTime = now;
            return next();
        }

        data.count++;
        
        if (data.count > max) {
            return res.status(429).json({
                status: 'error',
                message: 'Too many requests. Please wait a moment.'
            });
        }

        next();
    };
};

// Apply rate limit: 50 requests per 1 minute
const healthLimiter = rateLimit(60 * 1000, 50);
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
        //count 1 document to verify access
        await connection.collection(collectionName).findOne({}, { projection: { _id: 1 } });
        return { ok: true, code: 200 };
    } catch (e) {
        return { ok: false, error: e.message, code: 503 };
    }
};

router.get('/', async (req, res) => {
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
        res.status(503);
    }
    
    res.json(response);
});

// Check dependencies for /teacher/dashboard-v2
router.get('/dashboard', async (req, res) => {
    //const quizzesCheck = { ok: false, error: "Simulated Error" }; 

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
        res.status(503);
    }

    res.json(response);
});

// Check dependencies for /login
router.get('/login', async (req, res) => {
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
        res.status(503);
    }
    
    res.json(response);
});

// Check dependencies for /student/join-room-v2
router.get('/join-room', async (req, res) => {
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
        res.status(503);
    }
    
    res.json(response);
});

module.exports = router;
