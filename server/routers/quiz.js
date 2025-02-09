const express = require('express');
const router = express.Router();
const quizzes = require('../app.js').quizzes;
const jwt = require('../middleware/jwtToken.js');
const asyncHandler = require('./routerUtils.js');

if (!quizzes) {
  console.error("quizzes is not defined");
}

router.post("/create", jwt.authenticate, asyncHandler(quizzes.create));
router.get("/get/:quizId", jwt.authenticate, asyncHandler(asyncHandler(quizzes.get)));
router.get('/getRoomID/:quizId', jwt.authenticate, asyncHandler(quizzes.getRoomID));
router.delete("/delete/:quizId", jwt.authenticate, asyncHandler(quizzes.delete));
router.put("/update", jwt.authenticate, asyncHandler(quizzes.update));
router.put("/move", jwt.authenticate, asyncHandler(quizzes.move));

router.post("/duplicate", jwt.authenticate, asyncHandler(quizzes.duplicate));
router.post("/copy/:quizId", jwt.authenticate, asyncHandler(quizzes.copy));
router.put("/Share", jwt.authenticate, asyncHandler(quizzes.share));
router.get("/getShare/:quizId", jwt.authenticate, asyncHandler(quizzes.getShare));
router.post("/receiveShare", jwt.authenticate, asyncHandler(quizzes.receiveShare));

module.exports = router;