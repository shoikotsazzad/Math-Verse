const User = require('../models/User');
const MatchHistory = require('../models/MatchHistory');

const getLeaderboard = async (req, res, next) => {
  try {
    const { period = 'global', page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (period === 'global') {
      const users = await User.find({ isBanned: false })
        .sort({ rating: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('username avatarUrl rating xp stats.wins stats.totalMatches rank');

      const total = await User.countDocuments({ isBanned: false });
      return res.json({ users, total, period });
    }

    // Weekly / monthly — aggregate from MatchHistory
    const now = new Date();
    const since = new Date(now);
    if (period === 'weekly') since.setDate(now.getDate() - 7);
    if (period === 'monthly') since.setMonth(now.getMonth() - 1);

    const results = await MatchHistory.aggregate([
      { $match: { playedAt: { $gte: since }, result: { $in: ['win', 'loss', 'draw'] } } },
      {
        $group: {
          _id: '$userId',
          wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
          totalMatches: { $sum: 1 },
          totalXp: { $sum: '$xpEarned' },
        },
      },
      { $sort: { wins: -1, totalXp: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: '$user.username',
          avatarUrl: '$user.avatarUrl',
          rating: '$user.rating',
          rank: '$user.rank',
          wins: 1,
          totalMatches: 1,
          totalXp: 1,
        },
      },
    ]);

    res.json({ users: results, period });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaderboard };
