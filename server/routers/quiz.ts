import express, { Request, Response, NextFunction } from 'express';
import jwt from '../middleware/jwtToken';
import quizController from '../controllers/quiz';

const router = express.Router();

router.post("/create", jwt.authenticate, (req: Request, res: Response, next: NextFunction) => {
    quizController.create(req, res, next);
});

router.get("/get/:quizId", jwt.authenticate, (req: Request, res: Response, next: NextFunction) => {
    quizController.get(req, res, next);
});

router.delete("/delete/:quizId", jwt.authenticate, (req: Request, res: Response, next: NextFunction) => {
    quizController.delete(req, res, next);
});

router.put("/update", jwt.authenticate, (req: Request, res: Response, next: NextFunction) => {
    quizController.update(req, res, next);
});

router.put("/move", jwt.authenticate, (req: Request, res: Response, next: NextFunction) => {
    quizController.move(req, res, next);
});

router.post("/duplicate", jwt.authenticate, (req: Request, res: Response, next: NextFunction) => {
    quizController.duplicate(req, res, next);
});

router.post("/copy/:quizId", jwt.authenticate, (req: Request, res: Response, next: NextFunction) => {
    quizController.copy(req, res, next);
});

router.put("/Share", jwt.authenticate, (req: Request, res: Response, next: NextFunction) => {
    quizController.Share(req, res, next);
});

router.get("/getShare/:quizId", jwt.authenticate, (req: Request, res: Response, next: NextFunction) => {
    quizController.getShare(req, res, next);
});

router.post("/receiveShare", jwt.authenticate, (req: Request, res: Response, next: NextFunction) => {
    quizController.receiveShare(req, res, next);
});

export default router;
