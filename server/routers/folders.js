const express = require('express');
const router = express.Router();
const jwt = require('../middleware/jwtToken.js');

const foldersController = require('../controllers/folders.js')
const rbac = require("../middleware/rbac");

router.post("/create", jwt.authenticate, rbac.checkPermission('create_folders'), foldersController.create);
router.get("/getUserFolders", jwt.authenticate, rbac.checkPermission('read_folders'), foldersController.getUserFolders);
router.get("/getFolderContent/:folderId", jwt.authenticate, rbac.checkPermission('read_folders'), foldersController.getFolderContent);
router.delete("/delete/:folderId", jwt.authenticate, rbac.checkPermission('delete_folders'), foldersController.delete);
router.put("/rename", jwt.authenticate, rbac.checkPermission('update_folders'), foldersController.rename);

router.post("/duplicate", jwt.authenticate, rbac.checkPermission('create_folders', 'read_folders'), foldersController.duplicate);

router.post("/copy/:folderId", jwt.authenticate, rbac.checkPermission('create_folders', 'read_folders'), foldersController.copy);

module.exports = router;