const express = require('express');
const router = express.Router();
const jwt = require('../middleware/jwtToken.js');
const { validateFolderCreation } = require('../middleware/validation.js');
const rooms = require('../app.js').rooms;
const asyncHandler = require('./routerUtils.js');

router.post("/create", jwt.authenticate, validateFolderCreation, asyncHandler(rooms.create));
router.post("/roomExists", jwt.authenticate, asyncHandler(rooms.roomExists));
router.get("/getUserRooms", jwt.authenticate, asyncHandler(rooms.getUserRooms));
router.get('/getRoomTitle/:roomId', jwt.authenticate, asyncHandler(rooms.getRoomTitle));
router.get('/getRoomTitleByUserId/:userId', jwt.authenticate, asyncHandler(rooms.getRoomTitleByUserId));
router.get("/getRoomContent/:roomId", jwt.authenticate, asyncHandler(rooms.getRoomContent));
router.delete("/delete/:roomId", jwt.authenticate, asyncHandler(rooms.delete));
router.put("/rename", jwt.authenticate, validateFolderCreation, asyncHandler(rooms.rename));

module.exports = router;

module.exports.rooms = rooms;