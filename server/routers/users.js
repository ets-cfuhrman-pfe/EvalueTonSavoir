const express = require('express');
const router = express.Router();

const jwt = require('../middleware/jwtToken.js');
const usersController = require('../controllers/users.js')

router.post("/register", usersController.register);
router.post("/login", usersController.login);
router.post("/reset-password", usersController.resetPassword);
router.post("/change-password", jwt.authenticate, usersController.changePassword);
router.post("/delete-user", jwt.authenticate, usersController.delete);

module.exports = router;