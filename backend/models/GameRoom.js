const mongoose = require('mongoose');

const gameRoomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  mode: { type: String, enum: ['matchmaking', 'private', 'practice', 'daily'], required: true },
  category: { type: String, enum: ['math', 'memory', 'puzzle', 'logic'], default: 'math' },
  gameMode: { type: String, default: 'sprint' }, // sprint, fast_first, mind_snap, flash_anzan, ability
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    answeredCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    status: { type: String, enum: ['waiting', 'ready', 'playing', 'finished'], default: 'waiting' },
  }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
  startedAt: { type: Date },
  endedAt: { type: Date },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('GameRoom', gameRoomSchema);
