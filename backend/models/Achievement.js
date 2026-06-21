const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  iconUrl: { type: String, default: '' },
  criteria: {
    type: { type: String, required: true },
    threshold: { type: Number },
  },
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema);
