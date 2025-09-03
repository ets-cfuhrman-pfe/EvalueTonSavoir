const express = require('express');
const router = express.Router();
const users = require('../app.js').users;
const jwt = require('../middleware/jwtToken.js');
const { 
    validateUserRegistration, 
    validateUserLogin, 
    validateEmailOnly, 
    validatePasswordChange 
} = require('../middleware/validation.js');
const asyncHandler = require('./routerUtils.js');


router.post("/register", validateUserRegistration, asyncHandler(users.register));
router.post("/login", validateUserLogin, asyncHandler(users.login));
router.post("/reset-password", validateEmailOnly, asyncHandler(users.resetPassword));
router.post("/change-password", jwt.authenticate, validatePasswordChange, asyncHandler(users.changePassword));
router.post("/delete-user", jwt.authenticate, validateUserLogin, asyncHandler(users.delete));

module.exports = router;
