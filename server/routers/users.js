const express = require('express');
const router = express.Router();

const jwt = require('../middleware/jwtToken.js');
const usersController = require('../controllers/users.js')
const rbac = require("../middleware/rbac");

router.post("/register", usersController.register);
router.post("/login", usersController.login);
router.post("/reset-password", usersController.resetPassword);
router.post("/change-password", jwt.authenticate, usersController.changePassword);
router.post("/delete-user", jwt.authenticate, rbac.checkPermission('delete_user'), usersController.delete);

module.exports = router;