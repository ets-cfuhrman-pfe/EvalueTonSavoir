const { Router } = require("express");
const roomsController = require('../app.js').rooms;
const jwt = require('../middleware/jwtToken.js');

const router = Router();

router.get("/listRooms", async (req, res)=> {
    try {
        const data = await roomsController.listRooms();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to list rooms" });
    }
});


router.get("/createRoom", async (req, res) => {
    try {
        const data = await roomsController.createRoom();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to list rooms" });
    }
});

router.get("/deleteRoom", async (req, res) => {
    try {
        const data = await roomsController.deleteRoom();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to list rooms" });
    }
});

router.get("/getRoomStatus", async (req, res) => {
    try {
        const data = await roomsController.getRoomStatus();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to list rooms" });
    }
});



module.exports = router;
