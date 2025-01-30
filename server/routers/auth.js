const express = require('express');
const router = express.Router();
const jwt = require('../middleware/jwtToken.js');

const authController = require('../controllers/auth.js')

router.get("/getActiveAuth",authController.getActive);
router.get("/getRoomsRequireAuth", authController.getRoomsRequireAuth);

module.exports = router;