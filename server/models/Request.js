const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fromUserName: { type: String, default: '', trim: true },
  fromUserEmail: { type: String, default: '', lowercase: true, trim: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  toUserName: { type: String, default: '', trim: true },
  toUserEmail: { type: String, default: '', lowercase: true, trim: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  teamName: { type: String, default: '', trim: true },
  psCode: { type: String, default: '', trim: true },
  role: { type: String, default: 'Squad Member', trim: true },
  type: { type: String, enum: ['invite', 'join_request'], default: 'invite', index: true },
  message: { type: String, default: '', trim: true },
  pitchNote: { type: String, default: '', trim: true },
  proofOfWork: { type: String, default: '', trim: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
  isRead: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Compound Indexes for fast inbox lookups
requestSchema.index({ toUserId: 1, status: 1, createdAt: -1 });
requestSchema.index({ fromUserId: 1, status: 1, createdAt: -1 });
requestSchema.index({ teamId: 1, status: 1 });
requestSchema.index({ fromUserId: 1, toUserId: 1, teamId: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema);
