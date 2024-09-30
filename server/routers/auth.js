const express = require('express');
const router = express.Router();
const jwt = require('../middleware/jwtToken.js');

const authController = require('../controllers/auth.js')

router.get("/getActiveAuth",authController.getActive);

module.exports = router;