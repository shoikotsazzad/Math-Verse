const User = require('../models/User');
const MatchHistory = require('../models/MatchHistory');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-passwordHash -email')
      .populate('achievements');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const allowed = ['username', 'avatarUrl'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

const getUserMatches = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const matches = await MatchHistory.find({ userId: user._id })
      .sort({ playedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('opponentId', 'username avatarUrl rating');

    const total = await MatchHistory.countDocuments({ userId: user._id });

    res.json({ matches, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateMe, getUserMatches };
