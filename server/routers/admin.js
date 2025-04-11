const express = require('express');
const router = express.Router();
const admin = require('../app.js').admin;
const asyncHandler = require('./routerUtils.js');

const jwt = require('../middleware/jwtToken.js');


router.get("/getUsers", jwt.authenticate, asyncHandler(admin.getUsers));
router.get("/getStats", jwt.authenticate, asyncHandler(admin.getStats));
router.get("/getImages", jwt.authenticate, asyncHandler(admin.getImages));
router.delete("/deleteUser", jwt.authenticate, asyncHandler(admin.deleteUser));
router.delete("/deleteImage", jwt.authenticate, asyncHandler(admin.deleteImage));

module.exports = router;
