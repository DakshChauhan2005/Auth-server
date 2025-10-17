const userModel = require("../models/userModel");
const bcrypt = require('bcryptjs')
const { validationResult } = require('express-validator');

exports.registerController = async (req, res) => {
    // routing log
    console.log('register route called at :', new Date().toLocaleString())
    // console.log("body :   ",  req.body)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, mobile, password } = req.body;
    if (!name || !email || !mobile || !password) {
        return res.json({
            success: false,
            message: 'Missing details'
        })
    }

    // can also add password strength

    try {

        // checking if this email is new or not
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({
                success: false,
                message: 'User already exist'
            })
        }
        console.log(process.env.SALT);
        
        const hashedPassword = await bcrypt.hash(password, 10);
        // console.log("hash password :  ", hashedPassword);


        const newUser = await userModel.create({
            name,
            email,
            mobile,
            password: hashedPassword
        })

        const safeUser = {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            mobile: newUser.mobile,
            createdAt: newUser.createdAt,
        };

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: safeUser,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }
        console.error('Register error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

exports.loginController = async (req, res) => {
    console.log('login')
}
