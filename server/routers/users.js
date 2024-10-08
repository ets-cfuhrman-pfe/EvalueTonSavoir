const express = require('express');
const router = express.Router();

const jwt = require('../middleware/jwtToken.js');
const usersController = require('../controllers/users.js')

router.post("/delete-user", jwt.authenticate, usersController.delete);

module.exports = router;