const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  role: { type: String, required: true },
  proofOfWork: { type: String }, // Link to GitHub, LeetCode, or portfolio
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  hackathon: { type: String, required: true },
  description: { type: String, required: true },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaderName: { type: String, required: true },
  skills: [{ type: String }],
  rolesNeeded: [{ type: String }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxMembers: { type: Number, default: 4 },
  isOpen: { type: Boolean, default: true },
  requests: [requestSchema]
}, { timestamps: true });

// INDEXES FOR HIGH-CONCURRENCY SCALING (1,000 Users)
// 1. Text index on name & hackathon for ultra-fast search bar queries
teamSchema.index({ name: 'text', hackathon: 'text' });

// 2. Single field index on leader to check 3-team limits instantly
teamSchema.index({ leader: 1 });

// 3. Index on creation date for fast reverse-chronological sorting
teamSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Team', teamSchema);