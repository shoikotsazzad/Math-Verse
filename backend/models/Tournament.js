const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['registration', 'active', 'completed'], default: 'registration' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bracket: [{
    round: { type: Number },
    matches: [{
      player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameRoom' },
      isBye: { type: Boolean, default: false },
    }],
  }],
  startDate: { type: Date, required: true },
  championId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  maxParticipants: { type: Number, default: 16 },
  description: { type: String, default: '' },
  prizeXp: { type: Number, default: 500 },
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
