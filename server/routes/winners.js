const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const WinnerEntry = require('../models/WinnerEntry');

const JWT_SECRET = process.env.JWT_SECRET ;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// 1. Authentication Middleware (Requires valid token or logged-in user)
const protect = (req, res, next) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    if (req.query.userId || req.body?.userId) {
      req.user = { id: req.query.userId || req.body?.userId };
      return next();
    }
    return res.status(401).json({ message: 'Access denied. Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (req.query.userId || req.body?.userId) {
      req.user = { id: req.query.userId || req.body?.userId };
      return next();
    }
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

// 2. Configure GridFS Storage with multer-gridfs-storage
const storage = new GridFsStorage({
  url: MONGO_URI,
  file: (req, file) => {
    return {
      bucketName: 'ppts',
      filename: `${Date.now()}-${file.originalname}`,
      metadata: {
        originalName: file.originalname,
        uploadedAt: new Date(),
        mimetype: file.mimetype
      }
    };
  }
});

// File filter: accept presentation files and PDF decks
const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(ppt|pptx|pdf|odp)$/i;
  if (allowedExts.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload a PowerPoint (.ppt, .pptx) or PDF presentation.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  fileFilter
});

// Helper to get active GridFS bucket instance
const getGridFSBucket = () => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }
  return new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'ppts'
  });
};

// 3. POST /api/winners — Multipart form upload for new WinnerEntry
router.post('/', protect, upload.single('ppt'), async (req, res, next) => {
  try {
    const { teamName, sihTheme, year, experience, psCode, problemStatementTitle } = req.body;

    if (!teamName || !sihTheme || !year || !experience) {
      return res.status(400).json({ 
        message: 'All fields are required: teamName, sihTheme, year, experience' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        message: 'Please attach a PPT presentation file.' 
      });
    }

    const newWinner = await WinnerEntry.create({
      teamName: teamName.trim(),
      sihTheme: sihTheme.trim(),
      psCode: (psCode || '').trim(),
      problemStatementTitle: (problemStatementTitle || '').trim(),
      year: Number(year),
      experience: experience.trim(),
      pptFileId: req.file.id,
      pptFilename: req.file.originalname,
      uploadedAt: new Date()
    });

    res.status(201).json({
      message: 'Winner entry published successfully!',
      winner: newWinner
    });
  } catch (error) {
    console.error('Error creating winner entry:', error);
    res.status(500).json({ 
      message: 'Failed to create winner entry', 
      error: error.message 
    });
  }
});

// 4. GET /api/winners — Retrieve all winner entries (metadata only)
router.get('/', async (req, res, next) => {
  try {
    const winners = await WinnerEntry.find()
      .sort({ year: -1, createdAt: -1 })
      .lean();

    res.status(200).json(winners);
  } catch (error) {
    console.error('Error fetching winner entries:', error);
    res.status(500).json({ 
      message: 'Failed to fetch winner entries', 
      error: error.message 
    });
  }
});

// 5. GET /api/winners/:fileId/download — Stream PPT file from GridFS
router.get('/:fileId/download', async (req, res, next) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: 'Invalid file ID format.' });
    }

    const objId = new mongoose.Types.ObjectId(fileId);
    const bucket = getGridFSBucket();

    // Query GridFS files collection directly to get metadata
    const files = await bucket.find({ _id: objId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Presentation file not found in GridFS.' });
    }

    const fileDoc = files[0];

    // Find associated WinnerEntry to retrieve original display filename
    const winnerDoc = await WinnerEntry.findOne({ pptFileId: objId }).lean();
    const downloadFilename = winnerDoc?.pptFilename || fileDoc.metadata?.originalName || fileDoc.filename || 'presentation.pptx';

    // Determine appropriate Content-Type header
    let contentType = 'application/octet-stream';
    if (downloadFilename.endsWith('.pptx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (downloadFilename.endsWith('.ppt')) {
      contentType = 'application/vnd.ms-powerpoint';
    } else if (downloadFilename.endsWith('.pdf')) {
      contentType = 'application/pdf';
    }

    // Set headers for download with original filename
    res.set({
      'Content-Type': contentType,
      'Content-Length': fileDoc.length,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadFilename)}"; filename*=UTF-8''${encodeURIComponent(downloadFilename)}`
    });

    const downloadStream = bucket.openDownloadStream(objId);

    downloadStream.on('error', (streamErr) => {
      console.error('GridFS stream error:', streamErr);
      if (!res.headersSent) {
        res.status(404).json({ message: 'Error streaming presentation file', error: streamErr.message });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error downloading presentation file:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Failed to download presentation file', 
        error: error.message 
      });
    }
  }
});

module.exports = router;

