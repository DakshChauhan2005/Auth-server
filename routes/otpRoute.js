const express = require('express');
const { sendOtp } = require('../controller/otpController');
const router = express.Router();
// const { sendOtp } = require('../controller/otpControll');

router.get('/send' , sendOtp);

module.exports = router;