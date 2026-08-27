const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: '' },
  college: { type: String, default: 'IET DAVV' },
  role: { type: String, default: 'Backend Developer' },
  location: { type: String, default: 'Indore, MP' },
  about: { type: String, default: '' },
  skills: [{ type: String }],
  cfRating: { type: String, default: '' },
  codechefRating: { type: String, default: '' },
  leetcodeRating: { type: String, default: '' },
  dsaSolved: { type: String, default: '1000+' },
  github: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  resumeName: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);