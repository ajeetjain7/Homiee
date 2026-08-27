const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  tagline: { type: String, trim: true, default: '' },
  description: { type: String, required: true, trim: true },
  
  // SIH Specific Identifiers
  sihTheme: { type: String, required: true, index: true, trim: true }, // e.g. Agriculture & Rural Development
  categoryEdition: { type: String, enum: ['Software Edition', 'Hardware Edition'], default: 'Software Edition', index: true },
  psCode: { type: String, required: true, index: true, trim: true }, // e.g. SIH1420
  problemStatementTitle: { type: String, required: true, trim: true },
  organization: { type: String, default: 'Ministry / Organization', trim: true },
  
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaderName: { type: String, default: '' },
  coLeaders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxMembers: { type: Number, default: 6 },
  isOpen: { type: Boolean, default: true, index: true },
  
  // Role Vacancies Structure
  vacancies: [{
    roleName: { type: String, required: true, trim: true },
    count: { type: Number, default: 1 },
    status: { type: String, enum: ['Vacant', 'Filled'], default: 'Vacant' }
  }],
  
  // Technical Skills Required
  criticalSkills: [{
    skillName: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['CRITICAL', 'PREFERRED'], default: 'CRITICAL' }
  }],
  
  // Real-time Squad Chat Messages Persistence
  messages: [{
    user: {
      _id: { type: String },
      name: { type: String, default: 'Teammate' },
      email: { type: String, default: '' },
      avatar: { type: String, default: '' },
      role: { type: String, default: 'Member' }
    },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Compound Indexes for High-Performance Queries
teamSchema.index({ sihTheme: 1, isOpen: 1 });
teamSchema.index({ psCode: 1, isOpen: 1 });
teamSchema.index({ members: 1 });
teamSchema.index({ leader: 1 });

// Text Index for Fast Querying under Concurrency
teamSchema.index({ name: 'text', psCode: 'text', problemStatementTitle: 'text', description: 'text' });

module.exports = mongoose.model('Team', teamSchema);