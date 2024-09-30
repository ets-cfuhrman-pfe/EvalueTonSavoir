const express = require('express');
const router = express.Router();

const jwt = require('../middleware/jwtToken.js');
const quizController = require('../controllers/quiz.js')
const rbac = require('../middleware/rbac.js');

router.post("/create", jwt.authenticate, rbac.checkPermission('create_quiz'), quizController.create);
router.get("/get/:quizId", jwt.authenticate, rbac.checkPermission('participate_quiz'), quizController.get);
router.delete("/delete/:quizId", jwt.authenticate, rbac.checkPermission('delete_quiz'), quizController.delete);
router.put("/update", jwt.authenticate, rbac.checkPermission('update_quiz'), quizController.update);
router.put("/move", jwt.authenticate, rbac.checkPermission('update_quiz'), quizController.move);

router.post("/duplicate", jwt.authenticate, rbac.checkPermission('create_quiz', 'read_quiz'), quizController.duplicate);
router.post("/copy/:quizId", jwt.authenticate, rbac.checkPermission('create_quiz', 'read_quiz'), quizController.copy);
router.put("/Share", jwt.authenticate, rbac.checkPermission('create_quiz', 'read_quiz'), quizController.Share);
router.get("/getShare/:quizId", jwt.authenticate, rbac.checkPermission('create_quiz', 'read_quiz'), quizController.getShare);
router.post("/receiveShare", jwt.authenticate, rbac.checkPermission('create_quiz', 'read_quiz'), quizController.receiveShare);

module.exports = router;