const express = require('express');
const router = express.Router();
const admin = require('../app.js').admin;
const asyncHandler = require('./routerUtils.js');

const jwt = require('../middleware/jwtToken.js');


router.get("/get", jwt.authenticate, asyncHandler(admin.get));
router.delete("/delete", jwt.authenticate, asyncHandler(admin.delete));

module.exports = router;
