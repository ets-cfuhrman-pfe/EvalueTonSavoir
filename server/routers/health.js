const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const dbStatus = await require('../config/db.js').getConnection() ? 'connected' : 'disconnected';
        res.json({
            status: 'healthy',
            timestamp: new Date(),
            db: dbStatus
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

module.exports = router;