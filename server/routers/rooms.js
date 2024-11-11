const { Router } = require("express");
const roomsController = require('../app.js').rooms;
const jwt = require('../middleware/jwtToken.js');

const router = Router();

router.get("/", async (req, res)=> {
    try {
        const data = await roomsController.listRooms();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to list rooms" });
    }
});


router.post("/", async (req, res) => {
    try {
        const data = await roomsController.createRoom();
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create room :" + error });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const data = await roomsController.updateRoom(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to update rooms" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const data = await roomsController.deleteRoom(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: `Failed to delete room` });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const data = await roomsController.getRoomStatus(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to list room infos" });
    }
});

module.exports = router;
