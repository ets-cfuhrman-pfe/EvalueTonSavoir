const express = require('express');
const router = express.Router();
const users = require('../app.js').users;
const jwt = require('../middleware/jwtToken.js');

router.post("/register", users.register);
router.post("/login", users.login);
router.post("/reset-password", users.resetPassword);
router.post("/change-password", jwt.authenticate, users.changePassword);
router.post("/delete-user", jwt.authenticate, users.delete);

module.exports = router;
