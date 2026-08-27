const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  avatar: { type: String, default: '' },
  college: { type: String, default: 'College / Institute', trim: true },
  yearAndBranch: { type: String, default: '3rd Year • Computer Science', trim: true },
  primaryRole: { type: String, default: 'Fullstack Developer', index: true },
  status: { type: String, enum: ['Looking for Team', 'Team Full', 'Not Available'], default: 'Looking for Team' },
  
  // High Concurrency Match Metrics
  sihReadinessScore: { type: Number, default: 20 },
  technicalSkills: [{ type: String, trim: true }], // Removed duplicate inline 'index: true'
  sihThemes: [{ type: String, trim: true }],
  featuredProjects: [{ title: String, link: String, description: String }],
  
  // External Profiles
  github: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  
  // Competitive Programming
  leetcodeRating: { type: String, default: 'N/A' },
  codeforcesRating: { type: String, default: 'N/A' },
  codechefRating: { type: String, default: 'N/A' }
}, { timestamps: true });

// Explicit Indexes for Fast Search & Matching Queries
userSchema.index({ primaryRole: 1, sihReadinessScore: -1 });
userSchema.index({ technicalSkills: 1 });

module.exports = mongoose.model('User', userSchema);