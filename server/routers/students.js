const express = require('express');
const router = express.Router();
const students = require('../app.js').students;
const jwt = require('../middleware/jwtToken.js');
const asyncHandler = require('./routerUtils.js');

router.post('/create',jwt.authenticate, asyncHandler(students.create));
router.get('/get/:studentId', jwt.authenticate,asyncHandler(students.get));
router.delete('/delete/:studentId',jwt.authenticate, asyncHandler(students.delete));

module.exports = router;