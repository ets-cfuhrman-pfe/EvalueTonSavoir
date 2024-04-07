const express = require('express');
const router = express.Router();

const jwt = require('../middleware/jwtToken.js');
const quizController = require('../controllers/quiz.js')

router.post("/create", jwt.authenticate, quizController.create);
router.get("/get/:quizId", jwt.authenticate, quizController.get);
router.delete("/delete/:quizId", jwt.authenticate, quizController.delete);
router.put("/update", jwt.authenticate, quizController.update);
router.put("/move", jwt.authenticate, quizController.move);

router.post("/duplicate", jwt.authenticate, quizController.duplicate);
router.post("/copy/:quizId", jwt.authenticate, quizController.copy);
router.put("/Share", jwt.authenticate, quizController.Share);
router.get("/getShare/:quizId", jwt.authenticate, quizController.getShare);
router.post("/receiveShare", jwt.authenticate, quizController.receiveShare);

module.exports = router;