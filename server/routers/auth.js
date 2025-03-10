const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.js')

router.get("/getActiveAuth",authController.getActive);
router.get("/getRoomsRequireAuth", authController.getRoomsRequireAuth);

module.exports = router;