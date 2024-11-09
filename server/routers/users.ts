import express, { Response, Request } from "express";
import jwt from '../middleware/jwtToken.js';
import {controllers} from '../app.js'

const users = controllers.users
const router = express.Router();

router.post("/register", users.register);
router.post("/login", users.login);
router.post("/reset-password", users.resetPassword);
router.post("/change-password", jwt.authenticate, users.changePassword);
router.post("/delete-user", jwt.authenticate, users.delete);

export default router