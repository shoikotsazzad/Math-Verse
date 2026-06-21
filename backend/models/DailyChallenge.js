const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  leaderboard: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    completedAt: { type: Date },
  }],
}, { timestamps: true });

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);
