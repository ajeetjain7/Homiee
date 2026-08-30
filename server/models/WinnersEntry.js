const mongoose = require('mongoose');

const winnerEntrySchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true
  },
  sihTheme: {
    type: String,
    required: [true, 'SIH theme is required'],
    trim: true
  },
  psCode: {
    type: String,
    trim: true,
    default: ''
  },
  problemStatementTitle: {
    type: String,
    trim: true,
    default: ''
  },
  year: {
    type: Number,
    required: [true, 'Competition year is required']
  },
  experience: {
    type: String,
    required: [true, 'Experience write-up is required'],
    trim: true
  },
  pptFileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'PPT file reference ID is required'],
    index: true
  },
  pptFilename: {
    type: String,
    required: [true, 'PPT filename is required'],
    trim: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('WinnerEntry', winnerEntrySchema);

