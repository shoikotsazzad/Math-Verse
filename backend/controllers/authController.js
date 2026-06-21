const User = require('../models/User');
const { signToken, sendTokenCookie } = require('../utils/jwt');

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.create({ username, email, passwordHash: password });
    const token = signToken(user._id);
    sendTokenCookie(res, token);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        rating: user.rating,
        rank: user.rank,
        role: user.role,
        stats: user.stats,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.isBanned) {
      return res.status(403).json({ message: 'Account banned' });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    sendTokenCookie(res, token);

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        coins: user.coins,
        rating: user.rating,
        rank: user.rank,
        role: user.role,
        stats: user.stats,
        avatarUrl: user.avatarUrl,
        achievements: user.achievements,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

const logout = (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out' });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // In production, send email. For now just confirm.
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, logout, forgotPassword };
