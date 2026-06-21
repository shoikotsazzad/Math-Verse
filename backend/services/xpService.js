const User = require('../models/User');
const Achievement = require('../models/Achievement');
const MatchHistory = require('../models/MatchHistory');
const Notification = require('../models/Notification');

const XP_WIN = 50;
const XP_LOSS = 10;
const XP_PERFECT_BONUS = 20;
const XP_DAILY_LOGIN = 25;

const RANK_THRESHOLDS = [
  { min: 0, rank: 'Novice' },
  { min: 1100, rank: 'Apprentice' },
  { min: 1300, rank: 'Competitor' },
  { min: 1500, rank: 'Expert' },
  { min: 1700, rank: 'Master' },
  { min: 2000, rank: 'Grandmaster' },
];

const getRank = (rating) => {
  const tier = [...RANK_THRESHOLDS].reverse().find(t => rating >= t.min);
  return tier ? tier.rank : 'Novice';
};

const ACHIEVEMENT_DEFS = [
  { key: 'first_win', title: 'First Win', description: 'Win your first match', criteria: { type: 'wins', threshold: 1 } },
  { key: 'wins_10', title: 'On a Roll', description: 'Win 10 matches', criteria: { type: 'wins', threshold: 10 } },
  { key: 'wins_100', title: 'Century', description: 'Win 100 matches', criteria: { type: 'wins', threshold: 100 } },
  { key: 'perfect_accuracy', title: 'Perfect Mind', description: 'Complete a match with 100% accuracy', criteria: { type: 'perfect_match', threshold: 1 } },
  { key: 'streak_5', title: 'Hot Streak', description: 'Win 5 matches in a row', criteria: { type: 'streak', threshold: 5 } },
];

const seedAchievements = async () => {
  for (const def of ACHIEVEMENT_DEFS) {
    await Achievement.findOneAndUpdate({ key: def.key }, def, { upsert: true });
  }
};

const checkAndGrantAchievements = async (user, isPerfect) => {
  const allAchievements = await Achievement.find();
  const userAchievementIds = user.achievements.map(a => a.toString());
  const newAchievements = [];

  for (const ach of allAchievements) {
    if (userAchievementIds.includes(ach._id.toString())) continue;

    let earned = false;
    const { type, threshold } = ach.criteria;

    if (type === 'wins' && user.stats.wins >= threshold) earned = true;
    if (type === 'streak' && user.stats.bestStreak >= threshold) earned = true;
    if (type === 'perfect_match' && isPerfect) earned = true;

    if (earned) {
      user.achievements.push(ach._id);
      newAchievements.push(ach);
      await Notification.create({
        userId: user._id,
        type: 'achievement',
        message: `Achievement unlocked: ${ach.title}`,
      });
    }
  }

  return newAchievements;
};

const processMatchEnd = async (room) => {
  const results = [];

  for (const playerData of room.players) {
    const isWinner = room.winnerId && room.winnerId.toString() === playerData.userId.toString();
    const accuracy = playerData.answeredCount > 0
      ? Math.round((playerData.correctCount / playerData.answeredCount) * 100)
      : 0;
    const isPerfect = accuracy === 100 && playerData.answeredCount > 0;

    let xpEarned = isWinner ? XP_WIN : XP_LOSS;
    if (isPerfect) xpEarned += XP_PERFECT_BONUS;

    const opponent = room.players.find(p => p.userId.toString() !== playerData.userId.toString());
    const result = isWinner ? 'win' : (room.winnerId ? 'loss' : 'draw');

    const ratingDelta = isWinner ? 25 : -15;

    const user = await User.findById(playerData.userId);
    if (!user) continue;

    user.xp += xpEarned;
    user.rating = Math.max(0, user.rating + ratingDelta);
    user.rank = getRank(user.rating);
    user.stats.totalMatches += 1;

    if (result === 'win') {
      user.stats.wins += 1;
      user.stats.currentStreak += 1;
      if (user.stats.currentStreak > user.stats.bestStreak) {
        user.stats.bestStreak = user.stats.currentStreak;
      }
    } else if (result === 'loss') {
      user.stats.losses += 1;
      user.stats.currentStreak = 0;
    }

    user.stats.winRate = Math.round((user.stats.wins / user.stats.totalMatches) * 100);
    const totalAccuracy = ((user.stats.accuracy * (user.stats.totalMatches - 1)) + accuracy) / user.stats.totalMatches;
    user.stats.accuracy = Math.round(totalAccuracy);

    const newAchievements = await checkAndGrantAchievements(user, isPerfect);
    await user.save();

    await MatchHistory.create({
      userId: playerData.userId,
      opponentId: opponent?.userId,
      roomId: room._id,
      mode: room.mode,
      result,
      score: playerData.score,
      opponentScore: opponent?.score || 0,
      accuracy,
      xpEarned,
      playedAt: new Date(),
    });

    results.push({ userId: playerData.userId, xpEarned, newAchievements, result, ratingDelta });
  }

  return results;
};

module.exports = { processMatchEnd, seedAchievements, XP_DAILY_LOGIN };
