const express = require('express');
const router = express.Router();
const questionnaires = require('../app.js').questionnaires;
const jwt = require('../middleware/jwtToken.js');
const asyncHandler = require('./routerUtils.js');

if (!questionnaires) {
  console.error("questionnaires is not defined");
}

router.post("/create", jwt.authenticate, asyncHandler(questionnaires.create));
router.get("/get/:questionnaireId", jwt.authenticate, asyncHandler(asyncHandler(questionnaires.get)));
router.delete("/delete/:questionnaireId", jwt.authenticate, asyncHandler(questionnaires.delete));
router.put("/update", jwt.authenticate, asyncHandler(questionnaires.update));
router.put("/move", jwt.authenticate, asyncHandler(questionnaires.move));

router.post("/duplicate", jwt.authenticate, asyncHandler(questionnaires.duplicate));
router.post("/copy/:questionnaireId", jwt.authenticate, asyncHandler(questionnaires.copy));
router.put("/Share", jwt.authenticate, asyncHandler(questionnaires.share));
router.get("/getShare/:questionnaireId", jwt.authenticate, asyncHandler(questionnaires.getShare));
router.post("/receiveShare", jwt.authenticate, asyncHandler(questionnaires.receiveShare));

module.exports = router;
