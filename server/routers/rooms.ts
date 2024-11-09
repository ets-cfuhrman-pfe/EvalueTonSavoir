import express, { Response, Request } from "express";
import jwt from '../middleware/jwtToken.js';
import {controllers} from '../app.js'

const roomsController = controllers.rooms
const router = express.Router();

router.get("/", jwt.authenticate, async(req:Request,res:Response)=>{
    const data = await roomsController.listRooms();
    res.json(data)
});

export default router
