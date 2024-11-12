const { Router } = require("express");
const roomsController = require('../app.js').rooms;
const jwt = require('../middleware/jwtToken.js');

const router = Router();

router.get("/", async (req, res)=> {
    try {
        const data = await roomsController.listRooms();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Échec de listage des salle" });
    }
});


router.post("/", async (req, res) => {
    try {
        const data = await roomsController.createRoom();
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Échec de la création de salle :" + error });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const data = await roomsController.updateRoom(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Échec de la mise a jour de salle : "+error });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const data = await roomsController.deleteRoom(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: `Échec de suppression de la salle: `+error });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const data = await roomsController.getRoomStatus(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Impossible d'afficher les informations de la salle: " + error });
    }
});

module.exports = router;
