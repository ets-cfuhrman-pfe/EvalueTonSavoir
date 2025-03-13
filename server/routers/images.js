const express = require('express');
const router = express.Router();
const images = require('../app.js').images;
const asyncHandler = require('./routerUtils.js');

const jwt = require('../middleware/jwtToken.js');

// For getting the image out of the form data
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/upload", jwt.authenticate, upload.single('image'), asyncHandler(images.upload));
router.get("/get/:id", asyncHandler(images.get));
router.get("/getImages", asyncHandler(images.getImages));
router.get("/getUserImages", asyncHandler(images.getUserImages));
router.get("/delete", asyncHandler(images.delete));

module.exports = router;
