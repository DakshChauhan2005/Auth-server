const userModel = require("../models/userModel");
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require("jsonwebtoken")
exports.registerController = async (req, res) => {
    console.log('register route called at :', new Date().toLocaleString())

    // can also add password strength
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ success: false, errors: errors.array()[0] });
        }
        const { name, email, mobile, password } = req.body;
        if (!name || !email || !mobile || !password) {
            return res.json({
                success: false,
                message: 'Missing details'
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
        // console.log(process.env.SALT);

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
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }
        console.error('Register error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

exports.loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Missing login details",
            });
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Incorrect email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect email or password",
            });
        }

        // Create JWT
        const payload = { id: user._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

        // Cookie options
        const isProd = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        };

        return res
            .status(200)
            .cookie("authToken", token, cookieOptions)
            .json({
                success: true,
                message: "Login successful",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.mobile
                }
            });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}
exports.logoutController = async (req, res) => {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("authToken", {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
    });
    return res.json({ success: true, message: "Logged out" });
}

exports.userController = async (req, res) => {
    console.log("called");

    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        // console.log(user);

        return res.json({ success: true, user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}