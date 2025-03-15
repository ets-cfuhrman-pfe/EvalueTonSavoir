const express = require('express');
const router = express.Router();
const users = require('../app.js').users;
const jwt = require('../middleware/jwtToken.js');
const asyncHandler = require('./routerUtils.js');
const usersController = require('../controllers/user.js')

router.post("/register", asyncHandler(users.register));
router.post("/login", asyncHandler(users.login));
router.post("/reset-password", asyncHandler(users.resetPassword));
router.post("/change-password", jwt.authenticate, asyncHandler(users.changePassword));
router.post("/delete-user", jwt.authenticate, usersController);

module.exports = router;
