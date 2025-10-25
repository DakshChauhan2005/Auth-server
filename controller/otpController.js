const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Otp = require('../models/otpModel');
const nodemailer = require('nodemailer');
const { log } = require('console');
const userModel = require('../models/userModel')

const SALT_ROUNDS = Number(process.env.OTP_SALT_ROUNDS || 10);
// const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 5);
const TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES);
const OTP_TTL_MINUTES = isNaN(TTL_MINUTES) ? 5 : TTL_MINUTES;
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
        const { name, email, mobile, password, purpose = 'auth' } = req.body;
        if (!name || !email || !mobile || !password) {
            return res.status(422).json({
                success: false,
                message: 'Missing details'
            })
        }
        if (!email) {
            res.status(400).json({
                success: false,
                message: "Email required"
            })
        }
        // checking if this email is new or not
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exist'
            })
        }
        // chatGpt later (Rate limiter)
        // optional: check resend rate by counting non-expired OTPs created recently
        const recentCount = await Otp.countDocuments({
            email,
            purpose,
            createdAt: { $gt: new Date(Date.now() - 60 * 1000) } // last minute
        });
        if (recentCount >= MAX_RESEND_PER_MIN) {
            return res.status(429).json({ success: false, message: 'Too many requests. Try later.' });
        }

        const otpPlain = generateNumericOtp(6);
        const otpHash = await bcrypt.hash(otpPlain, SALT_ROUNDS);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // store OTP in mongoDB
        await Otp.create({ email, otpHash, purpose, expiresAt });

        const info = await transporter.sendMail({
            from: 'dakahchauhan111@gmail.com',
            to: email,
            subject: "One Time Password verification",
            text: `Your OTP is ${otpPlain}. It expires in ${OTP_TTL_MINUTES} minutes.`,
        });
        // only need for dev log
        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        return res.json({
            success: true,
            message: "OTP sent"
        })
    } catch (err) {
        console.error('sendOtp err', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp, purpose = 'auth' } = req.body;
        console.log(req.body);

        if (!email || !otp) return res.status(400).json({
            success: false,
            message: 'Email and OTP required'
        });

        // find non-expired OTP docs for this email & purpose (most recent first)
        const otpDoc = await Otp.findOne({ email, purpose }).sort({ createdAt: -1 });
        if (!otpDoc) return res.status(400).json({
            success: false,
            message: 'No OTP found or expired'
        });

        if (otpDoc.expiresAt < new Date()) {
            // doc will auto-delete by TTL index shortly but handle explicitly
            await otpDoc.deleteOne();
            return res.status(400).json({
                success: false,
                message: 'OTP expired'
            });
        }

        // rate limit attempts for this OTP
        if (otpDoc.attempts >= 5) {
            await otpDoc.deleteOne();
            return res.status(429).json({ success: false, message: 'Too many attempts' });
        }

        const match = await bcrypt.compare(otp, otpDoc.otpHash);
        if (!match) {
            otpDoc.attempts += 1;
            await otpDoc.save();
            return res.status(401).json({ success: false, message: 'Invalid OTP' });
        }

        // success: remove OTP record and proceed with desired action
        await otpDoc.deleteOne();

        // e.g., mark user verified, issue token, etc.
        console.log("verified");
        return res.json({ success: true, message: 'OTP verified' });
    } catch (err) {
        console.error('verifyOtp err', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
