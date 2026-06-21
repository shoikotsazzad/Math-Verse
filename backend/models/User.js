const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  xp: { type: Number, default: 0 },
  coins: { type: Number, default: 500 },
  rating: { type: Number, default: 1000 },
  rank: { type: String, default: 'Novice' },
  league: { type: String, default: 'Bronze' },
  // Per-category Elo ratings
  mathRating: { type: Number, default: 1000 },
  memoryRating: { type: Number, default: 1000 },
  puzzleRating: { type: Number, default: 1000 },
  logicRating: { type: Number, default: 1000 },
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    totalMatches: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
  },
  achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isBanned: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
  lastActiveDate: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.index({ rating: -1 });
userSchema.index({ xp: -1 });

module.exports = mongoose.model('User', userSchema);
