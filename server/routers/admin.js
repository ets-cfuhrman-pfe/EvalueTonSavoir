const express = require('express');
const router = express.Router();
const admin = require('../app.js').admin;
const asyncHandler = require('./routerUtils.js');

const jwt = require('../middleware/jwtToken.js');


router.get("/getUsers", asyncHandler(admin.getUsers));
router.get("/getQuizzes", asyncHandler(admin.getQuizzes));
router.get("/getImages", asyncHandler(admin.getImages));
router.delete("/deleteUser", asyncHandler(admin.deleteUser));
router.delete("/deleteQuiz", asyncHandler(admin.deleteQuiz));
router.delete("/deleteImage", jwt.authenticate, asyncHandler(admin.deleteImage));

module.exports = router;
