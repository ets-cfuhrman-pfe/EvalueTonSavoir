const express = require('express');
const multer = require('multer');
const router = express.Router();

const adminDataController = require('../app.js').adminData;
const jwt = require('../middleware/jwtToken.js');
const adminOnly = require('../middleware/adminOnly');
const asyncHandler = require('./routerUtils.js');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }
});

router.get(
    '/data/:resource/:userId/export',
    jwt.authenticate,
    adminOnly,
    asyncHandler(adminDataController.exportResource)
);

router.post(
    '/data/:resource/:userId/import',
    jwt.authenticate,
    adminOnly,
    upload.single('file'),
    asyncHandler(adminDataController.importResource)
);

module.exports = router;