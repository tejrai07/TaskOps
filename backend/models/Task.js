const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  deadline: { type: Date, required: true },
  userEnergy: { type: Number, required: true, min: 1, max: 10 },
  urgencyScore: { type: Number },
  burnoutIndex: { type: Number },
  aiRationale: { type: String },
  routedAction: { type: String },
  targetTool: { type: String },
  aiMessage: { type: String },
  personalizedRecommendation: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
