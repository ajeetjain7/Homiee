const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  tagline: { type: String, trim: true },
  description: { type: String, required: true },
  
  // SIH Specific Identifiers
  sihTheme: { type: String, required: true, index: true }, // e.g. Agriculture & Rural Development
  categoryEdition: { type: String, enum: ['Software Edition', 'Hardware Edition'], default: 'Software Edition' },
  psCode: { type: String, required: true, index: true }, // e.g. SIH1420
  problemStatementTitle: { type: String, required: true },
  organization: { type: String, default: 'Ministry / Organization' },
  
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  coLeaders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxMembers: { type: Number, default: 6 },
  isOpen: { type: Boolean, default: true, index: true },
  
  // Role Vacancies Structure
  vacancies: [{
    roleName: { type: String, required: true }, // e.g. AI/ML Engineer
    count: { type: Number, default: 1 },
    status: { type: String, enum: ['Vacant', 'Filled'], default: 'Vacant' }
  }],
  
  // Technical Skills Required
  criticalSkills: [{
    skillName: { type: String, required: true },
    priority: { type: String, enum: ['CRITICAL', 'PREFERRED'], default: 'CRITICAL' }
  }],
  
  // Join Requests
  requests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: String,
    role: String,
    pitchNote: String,
    proofOfWork: String,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Text Index for Fast Querying under Concurrency
teamSchema.index({ name: 'text', psCode: 'text', problemStatementTitle: 'text' });

module.exports = mongoose.model('Team', teamSchema);