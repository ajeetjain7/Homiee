const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: true, index: true },
  fromUserName: { type: String, default: '' },
  toUserId: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: true, index: true },
  toUserName: { type: String, default: '' },
  teamId: { type: mongoose.Schema.Types.Mixed, ref: 'Team', required: true, index: true },
  teamName: { type: String, default: '' },
  psCode: { type: String, default: '' },
  role: { type: String, default: 'Squad Member' },
  type: { type: String, enum: ['invite', 'join_request'], default: 'invite', index: true },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);

