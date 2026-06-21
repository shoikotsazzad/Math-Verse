const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, forgotPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.get('/me', protect, getMe);

module.exports = router;
