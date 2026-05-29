const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const passport = require('passport');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/logout', logout);
router.get('/me', protect, getMe);

// Google OAuth
router.get('/google', authLimiter, passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', authLimiter, passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
  const token = require('jsonwebtoken').sign({ id: req.user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('token', token, options);
  res.redirect(`${process.env.CLIENT_URL}/dashboard`);
});

module.exports = router;
