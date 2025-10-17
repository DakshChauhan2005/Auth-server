const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Otp = require('../models/otpModel');
const nodemailer = require('nodemailer');

const SALT_ROUNDS = Number(process.env.OTP_SALT_ROUNDS || 10);
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 5);
const MAX_RESEND_PER_MIN = 3; // simple limit

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

function generateNumericOtp(length = 6) {
    const digits = '0123456789';
    let otp = '';
    while (otp.length < length) {
        const byte = crypto.randomBytes(1)[0];
        const index = byte % digits.length;
        otp += digits[index];
    }
    return otp;
}

exports.sendOtp = async (req, res) => {
    try {
        const info = await transporter.sendMail({
            from: 'dakahchauhan111@gmail.com', // sender address
            to: "ayushsingh638684@gmail.com", // list of receivers
            subject: "Hello", // Subject line
            text: "Hello world?", // plain text body
            html: "<b>Hello bkc world?</b>", // html body
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (err) {
        console.error('sendOtp err', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};