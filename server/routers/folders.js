const express = require('express');
const router = express.Router();
const jwt = require('../middleware/jwtToken.js');
const folders = require('../app.js').folders;
const asyncHandler = require('./routerUtils.js');

router.post("/create", jwt.authenticate, asyncHandler(folders.create));
router.get("/getUserFolders", jwt.authenticate, asyncHandler(folders.getUserFolders));
router.get("/getFolderContent/:folderId", jwt.authenticate, asyncHandler(folders.getFolderContent));
router.delete("/delete/:folderId", jwt.authenticate, asyncHandler(folders.delete));
router.put("/rename", jwt.authenticate, asyncHandler(folders.rename));

router.post("/duplicate", jwt.authenticate, asyncHandler(folders.duplicate));

router.post("/copy/:folderId", jwt.authenticate, asyncHandler(folders.copy));

module.exports = router;

// export also folders (the controller)
module.exports.folders = folders;

// Refer to folders using: const folders = require('../controllers/folders.js').folders;
