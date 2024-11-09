import express, { Response, Request } from "express";
import jwt from '../middleware/jwtToken.js';
import {controllers} from '../app.js'

const quizzes = controllers.quizzes
const router = express.Router();

if (!quizzes) {
  console.error("quizzes is not defined");
}

router.post("/create", jwt.authenticate, quizzes.create);
router.get("/get/:quizId", jwt.authenticate, quizzes.get);
router.delete("/delete/:quizId", jwt.authenticate, quizzes.delete);
router.put("/update", jwt.authenticate, quizzes.update);
router.put("/move", jwt.authenticate, quizzes.move);

router.post("/duplicate", jwt.authenticate, quizzes.duplicate);
router.post("/copy/:quizId", jwt.authenticate, quizzes.copy);
router.put("/Share", jwt.authenticate, quizzes.share);
router.get("/getShare/:quizId", jwt.authenticate, quizzes.getShare);
router.post("/receiveShare", jwt.authenticate, quizzes.receiveShare);

export default router
