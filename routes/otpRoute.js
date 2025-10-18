const express = require('express');
const { sendOtp, verifyOtp } = require('../controller/otpController');
const router = express.Router();
// const { sendOtp } = require('../controller/otpControll');

router.get('/send' , sendOtp);
router.post('/verify', verifyOtp)

module.exports = router;