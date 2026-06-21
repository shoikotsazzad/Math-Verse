const User = require('../models/User');
const MatchHistory = require('../models/MatchHistory');
const Question = require('../models/Question');

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = search
      ? { $or: [{ username: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
      : {};

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);
    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
};

const banUser = async (req, res, next) => {
  try {
    const { ban } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: ban !== false },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user, message: user.isBanned ? 'User banned' : 'User unbanned' });
  } catch (err) {
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const [totalUsers, totalMatches, bannedUsers, recentMatches] = await Promise.all([
      User.countDocuments(),
      MatchHistory.countDocuments(),
      User.countDocuments({ isBanned: true }),
      MatchHistory.countDocuments({ playedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    ]);

    const topUsers = await User.find({ isBanned: false })
      .sort({ rating: -1 })
      .limit(5)
      .select('username rating xp stats.wins');

    const matchesByDay = await MatchHistory.aggregate([
      { $match: { playedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$playedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ totalUsers, totalMatches, bannedUsers, recentMatches, topUsers, matchesByDay });
  } catch (err) {
    next(err);
  }
};

const getReports = async (req, res, next) => {
  try {
    const questionStats = await Question.aggregate([
      { $group: { _id: { type: '$type', difficulty: '$difficulty' }, count: { $sum: 1 } } },
      { $sort: { '_id.type': 1 } },
    ]);
    res.json({ questionStats });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, banUser, getAnalytics, getReports };
