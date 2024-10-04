const express = require('express');
const router = express.Router();
const jwt = require('../middleware/jwtToken.js');
const folders = require('../app.js').folders;

router.post("/create", jwt.authenticate, folders.create);
router.get("/getUserFolders", jwt.authenticate, folders.getUserFolders);
router.get("/getFolderContent/:folderId", jwt.authenticate, folders.getFolderContent);
router.delete("/delete/:folderId", jwt.authenticate, folders.delete);
router.put("/rename", jwt.authenticate, folders.rename);

//router.post("/duplicate", jwt.authenticate, foldersController.duplicate);
router.post("/duplicate", jwt.authenticate, folders.duplicate);

router.post("/copy/:folderId", jwt.authenticate, folders.copy);

module.exports = router;

// export also folders (the controller)
module.exports.folders = folders;

// Refer to folders using: const folders = require('../controllers/folders.js').folders;
