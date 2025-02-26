const express = require('express');
const router = express.Router();
const quizzes = require('../app.js').quizzes;
const jwt = require('../middleware/jwtToken.js');
const asyncHandler = require('./routerUtils.js');

router.post('/create', jwt.authenticate, asyncHandler(quizzes.create));
router.get('/get/:quizId',jwt.authenticate, asyncHandler(quizzes.get));
router.delete('/delete/:quizId', jwt.authenticate, asyncHandler(quizzes.delete));

module.exports = router;