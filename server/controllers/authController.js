const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const { redisClient } = require('../config/redisClient');
const crypto = require('crypto');

const sendTokenResponse = async (user, statusCode, req, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Generate a unique session ID
  const sessionId = crypto.randomBytes(16).toString('hex');
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  // Basic parsing for demo
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';

  let device = 'Desktop';
  if (userAgent.includes('Mobile')) device = 'Mobile';

  const sessionData = {
    id: sessionId,
    device,
    browser,
    location: 'Unknown Location', // In real app use geoip on req.ip
    ip: req.ip || req.connection.remoteAddress,
    lastActive: new Date().toISOString(),
    token
  };

  // Store in Redis (Key: session:userId:sessionId)
  try {
    if (redisClient.isReady) {
      await redisClient.setEx(`session:${user._id}:${sessionId}`, 7 * 24 * 60 * 60, JSON.stringify(sessionData));
    } else {
      console.warn('Redis is not ready, skipping session tracking.');
    }
  } catch (err) {
    console.error('Failed to save session to Redis:', err);
  }

  // Add sessionId to payload or just rely on token matching later. Actually, it's easier to just store token hash in Redis or use sessionId in a separate cookie.
  // We'll just set it in a cookie alongside token.
  res.cookie('sessionId', sessionId, options);

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      user
    });
};

exports.register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password } = validatedData;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    sendTokenResponse(user, 201, req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  const sessionId = req.cookies.sessionId;
  try {
    if (req.user && sessionId && redisClient.isReady) {
      await redisClient.del(`session:${req.user.id}:${sessionId}`);
    }
  } catch (err) {
    console.error('Failed to delete session from Redis:', err);
  }

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.cookie('sessionId', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};
