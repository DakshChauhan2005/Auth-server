const express = require('express');
const { body } = require('express-validator');
const { registerController, loginController } = require('../controller/authController');
const router = express.Router();

router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('mobile').notEmpty().withMessage('Mobile required'),
    body('password').isLength({ min: 6 }).withMessage('Password min length 6'),
], registerController);
router.post('/login', loginController)

module.exports = router;