const express = require('express');
const router = express.Router();

const jwt = require('../middleware/jwtToken.js');
const imagesController = require('../controllers/images.js')
const rbac = require("../middleware/rbac");

// For getting the image out of the form data
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/upload", jwt.authenticate, rbac.checkPermission('create_images'), upload.single('image'), imagesController.upload);
router.get("/get/:id", imagesController.get);

module.exports = router;