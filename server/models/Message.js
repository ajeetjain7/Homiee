const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.Mixed, ref: 'Team', required: true, index: true },
  user: {
    _id: String,
    name: String,
    email: String,
    avatar: String,
    role: String
  },
  message: { type: String, required: true, trim: true },
  createdAt: { 
    type: Date, 
    default: Date.now,
    // MongoDB native TTL index: automatically deletes document after 3 days (259,200 seconds)
    expires: 259200
  }
}, { timestamps: true });

// Compound Index for fast team message lookups
messageSchema.index({ teamId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

