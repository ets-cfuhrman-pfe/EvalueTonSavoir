const express = require('express');
const router = express.Router();

const adminDataController = require('../app.js').adminData;
const jwt = require('../middleware/jwtToken.js');
const adminOnly = require('../middleware/adminOnly');
const asyncHandler = require('./routerUtils.js');

router.get(
    '/data/all/:userId/export',
    jwt.authenticate,
    adminOnly,
    asyncHandler(adminDataController.exportAllResources)
);

module.exports = router;