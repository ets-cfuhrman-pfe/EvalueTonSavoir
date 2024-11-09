import express, { Response, Request } from "express";
import jwt from '../middleware/jwtToken.js';
import {controllers} from '../app.js'
import multer from 'multer';

const images = controllers.images
const router = express.Router();

// For getting the image out of the form data
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/upload", jwt.authenticate, upload.single('image'), images.upload);
router.get("/get/:id", images.get);

export default router
