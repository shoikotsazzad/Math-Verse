const mongoose = require('mongoose');

const matchHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opponentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameRoom' },
  mode: { type: String, enum: ['matchmaking', 'private', 'practice', 'daily'], required: true },
  result: { type: String, enum: ['win', 'loss', 'draw'], required: true },
  score: { type: Number, default: 0 },
  opponentScore: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  xpEarned: { type: Number, default: 0 },
  playedAt: { type: Date, default: Date.now },
}, { timestamps: true });

matchHistorySchema.index({ userId: 1, playedAt: -1 });

module.exports = mongoose.model('MatchHistory', matchHistorySchema);
