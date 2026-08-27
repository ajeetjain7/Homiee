const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, select: false },
  googleId: { type: String, default: '', index: true },
  avatar: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  
  // Academic & Personal Details
  college: { type: String, default: 'College / Institute', trim: true },
  classBranch: { type: String, default: 'Computer Science & Engineering', trim: true },
  section: { type: String, default: 'Section A', trim: true },
  year: { type: String, default: '3rd Year', trim: true },
  yearAndBranch: { type: String, default: '3rd Year • Computer Science', trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'], default: 'Prefer not to say' },
  about: { type: String, default: '', trim: true },

  // Role & Capabilities
  primaryRole: { type: String, default: 'Fullstack Developer' },
  capabilities: [{ type: String, trim: true }], // e.g. 'PPT Making', 'Pitch Deck', 'Backend', 'Frontend'
  status: { type: String, enum: ['Looking for Team', 'Team Full', 'Not Available'], default: 'Looking for Team' },
  
  // Profile Completion Flags
  profileComplete: { type: Boolean, default: false },
  isProfileComplete: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  
  // High Concurrency Match Metrics
  sihReadinessScore: { type: Number, default: 20 },
  technicalSkills: [{ type: String, trim: true }],
  sihThemes: [{ type: String, trim: true }],
  featuredProjects: [{ title: String, link: String, description: String }],
  hackathonsCount: { type: Number, default: 0 },
  
  // External Profiles & Credentials
  whatsappNumber: { type: String, default: '' },
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  dsaRating: { type: String, default: '' },
  
  // Competitive Programming
  leetcodeRating: { type: String, default: 'N/A' },
  codeforcesRating: { type: String, default: 'N/A' },
  codechefRating: { type: String, default: 'N/A' }
}, { timestamps: true });

// Explicit Compound & Field Indexes
userSchema.index({ primaryRole: 1, sihReadinessScore: -1 });
userSchema.index({ technicalSkills: 1 });
userSchema.index({ gender: 1 });
userSchema.index({ isPublic: 1, status: 1 });
userSchema.index({ profileComplete: 1, isProfileComplete: 1 });

module.exports = mongoose.model('User', userSchema);