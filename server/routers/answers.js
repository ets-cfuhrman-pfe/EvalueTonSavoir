const express = require('express');
const router = express.Router();
const answers = require('../app.js').answers;
const jwt = require('../middleware/jwtToken.js');
const asyncHandler = require('./routerUtils.js');

router.post('/create',jwt.authenticate, asyncHandler(answers.create));
router.get('/get/:answerId',jwt.authenticate, asyncHandler(answers.get));
router.delete('/delete/:answerId',jwt.authenticate, asyncHandler(answers.delete));

module.exports = router;