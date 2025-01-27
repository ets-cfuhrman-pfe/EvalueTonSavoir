const express = require('express');
const router = express.Router();
const images = require('../app.js').images;

const jwt = require('../middleware/jwtToken.js');

// For getting the image out of the form data
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/upload", jwt.authenticate, upload.single('image'), images.upload);
router.get("/get/:id", images.get);

module.exports = router;
