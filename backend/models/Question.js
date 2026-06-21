const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['addition', 'subtraction', 'multiplication', 'division', 'percentage', 'sequence', 'logic', 'pattern', 'memory'],
    required: true,
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  prompt: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  generatedBy: { type: String, enum: ['system', 'admin'], default: 'system' },
}, { timestamps: true });

questionSchema.index({ type: 1, difficulty: 1 });

module.exports = mongoose.model('Question', questionSchema);
