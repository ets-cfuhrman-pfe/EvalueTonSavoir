const express = require('express');
const router = express.Router();
const quizzes = require('../app.js').quizzes;
const jwt = require('../middleware/jwtToken.js');
const { validateQuizCreation, validateQuizUpdate } = require('../middleware/validation.js');
const asyncHandler = require('./routerUtils.js');
const logger = require('../config/logger');

if (!quizzes) {
  logger.error("quizzes is not defined", {
    module: 'router/quiz',
    error: 'Quiz module not properly initialized'
  });
}

router.post("/create", jwt.authenticate, validateQuizCreation, asyncHandler(quizzes.create));
router.get("/get/:quizId", jwt.authenticate, asyncHandler(asyncHandler(quizzes.get)));
router.delete("/delete/:quizId", jwt.authenticate, asyncHandler(quizzes.delete));
router.put("/update", jwt.authenticate, validateQuizUpdate, asyncHandler(quizzes.update));
router.put("/move", jwt.authenticate, asyncHandler(quizzes.move));

router.post("/duplicate", jwt.authenticate, asyncHandler(quizzes.duplicate));
router.post("/copy/:quizId", jwt.authenticate, asyncHandler(quizzes.copy));
router.put("/Share", jwt.authenticate, asyncHandler(quizzes.share));
router.get("/getShare/:quizId", jwt.authenticate, asyncHandler(quizzes.getShare));
router.post("/receiveShare", jwt.authenticate, asyncHandler(quizzes.receiveShare));

module.exports = router;
