const express = require('express');
const { body } = require('express-validator');
const { registerController, loginController, userController, logoutController } = require('../controller/authController');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('mobile').notEmpty().withMessage('Mobile required'),
    body('password').isLength({ min: 6 }).withMessage('Password min length 6'),
], registerController);
router.post('/login', loginController)
router.get('/me', requireAuth , userController)
router.get('/logout' , logoutController)

module.exports = router;