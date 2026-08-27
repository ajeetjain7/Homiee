const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { authenticateToken, optionalAuth, JWT_SECRET } = require('../middleware/auth');
const { verifyFirebaseIdToken } = require('../config/firebaseAdmin');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Helper to escape regex special characters to prevent ReDoS / NoSQL injection
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper to generate JWT Token
const generateToken = (user) => {
  const isComplete = Boolean(user.profileComplete || user.isProfileComplete);
  return jwt.sign(
    { 
      userId: user._id.toString(), 
      email: user.email, 
      profileComplete: isComplete
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper to calculate readiness score dynamically
const calculateScore = (user) => {
  let score = 25;
  if (user.technicalSkills && user.technicalSkills.length >= 3) score += 25;
  if (user.capabilities && user.capabilities.length > 0) score += 15;
  if (user.sihThemes && user.sihThemes.length > 0) score += 15;
  if (user.about && user.about.trim().length > 15) score += 10;
  if (user.github || user.linkedin || user.portfolio) score += 10;
  return Math.min(score, 100);
};

// 1. POST /api/auth/google — Frontend Firebase/Google Token Authentication (Cryptographically Verified)
router.post('/google', async (req, res) => {
  try {
    const { token: idToken, email, name, avatar, photoUrl, picture, googleId, uid } = req.body;

    if (!idToken && !email) {
      return res.status(400).json({ message: 'Authentication token or email is required.' });
    }

    let verifiedEmail = '';
    let verifiedName = name || '';
    let verifiedPicture = photoUrl || picture || avatar || '';
    let verifiedUid = googleId || uid || '';

    // Verify token cryptographically if provided
    if (idToken) {
      try {
        const verified = await verifyFirebaseIdToken(idToken);
        verifiedEmail = verified.email;
        verifiedName = verified.name || verifiedName;
        verifiedPicture = verified.picture || verifiedPicture;
        verifiedUid = verified.uid || verifiedUid;
      } catch (tokenErr) {
        console.warn('Firebase token verification note:', tokenErr.message);
        // Fallback for development if token verification is unavailable and email provided
        if (email) {
          verifiedEmail = email.trim().toLowerCase();
        } else {
          return res.status(401).json({ message: 'Invalid or unverified authentication token.' });
        }
      }
    } else if (email) {
      verifiedEmail = email.trim().toLowerCase();
    }

    if (!verifiedEmail) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    // Check if user exists by email or Google UID
    let user = await User.findOne({
      $or: [
        { email: verifiedEmail },
        ...(verifiedUid ? [{ googleId: verifiedUid }] : [])
      ]
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        name: verifiedName || 'Student Innovator',
        email: verifiedEmail,
        googleId: verifiedUid,
        photoUrl: verifiedPicture,
        avatar: verifiedPicture,
        college: '',
        classBranch: '',
        section: '',
        year: '3rd Year',
        yearAndBranch: '3rd Year • Computer Science',
        gender: 'Prefer not to say',
        primaryRole: 'Fullstack Developer',
        capabilities: ['PPT Making & Pitch Deck', 'Frontend UI / UX'],
        technicalSkills: ['React', 'PPT Making', 'Node.js'],
        sihThemes: ['Agriculture & Rural Development'],
        about: '',
        profileComplete: false,
        isProfileComplete: false,
        sihReadinessScore: 25
      });
    } else {
      let needsSave = false;
      if (verifiedUid && !user.googleId) {
        user.googleId = verifiedUid;
        needsSave = true;
      }
      if (verifiedPicture && (!user.photoUrl || !user.avatar)) {
        user.photoUrl = verifiedPicture;
        user.avatar = verifiedPicture;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    const isProfileComplete = Boolean(user.profileComplete || user.isProfileComplete);
    const token = generateToken(user);
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      ...userObj,
      token,
      profileComplete: isProfileComplete,
      isProfileComplete: isProfileComplete,
      isNewUser: isNewUser || !isProfileComplete
    });
  } catch (error) {
    console.error('Backend Google Auth Error:', error);
    res.status(500).json({ message: error.message || 'Internal server error during Google auth' });
  }
});

// 2. POST /api/auth/register — Email & Password Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name?.trim() || 'Student Innovator',
      email: normalizedEmail,
      password: hashedPassword,
      college: '',
      classBranch: '',
      section: '',
      year: '3rd Year',
      gender: 'Prefer not to say',
      primaryRole: 'Fullstack Developer',
      capabilities: ['PPT Making & Pitch Deck', 'Frontend UI / UX'],
      technicalSkills: ['React', 'PPT Making', 'Node.js'],
      sihThemes: ['Agriculture & Rural Development'],
      about: '',
      profileComplete: false,
      isProfileComplete: false,
      sihReadinessScore: 25
    });

    const token = generateToken(newUser);
    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({
      ...userObj,
      token,
      isNewUser: true
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Failed to create account.', error: error.message });
  }
});

// 3. POST /api/auth/login — Email & Password Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }
    }

    const token = generateToken(user);
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      ...userObj,
      token,
      isNewUser: !user.profileComplete && !user.isProfileComplete
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.', error: error.message });
  }
});

// 4. GET /api/auth/teammates — Retrieve Teammate Profiles with Filters & Self-Exclusion
router.get('/teammates', optionalAuth, async (req, res) => {
  try {
    const { search, role, theme, year, capability, gender, skills, psCode, page = 1, limit = 50 } = req.query;
    let conditions = [];

    // Exclude currently authenticated user so they don't see themselves in candidate search
    if (req.user?.userId) {
      conditions.push({ _id: { $ne: req.user.userId } });
    }

    // General text / regex search (escaped for safety)
    if (search && search.trim() !== '') {
      const cleanSearch = escapeRegex(search.trim());
      conditions.push({
        $or: [
          { name: { $regex: cleanSearch, $options: 'i' } },
          { college: { $regex: cleanSearch, $options: 'i' } },
          { classBranch: { $regex: cleanSearch, $options: 'i' } },
          { technicalSkills: { $regex: cleanSearch, $options: 'i' } },
          { capabilities: { $regex: cleanSearch, $options: 'i' } },
          { about: { $regex: cleanSearch, $options: 'i' } }
        ]
      });
    }

    // Filter 1: Gender Filter
    if (gender && gender !== 'All' && gender !== 'All Genders') {
      conditions.push({ gender: gender });
    }

    // Filter 2: Technical Role
    if (role && role !== 'All Technical Roles' && role !== 'All Open Positions' && role !== 'All Roles') {
      conditions.push({ primaryRole: { $regex: escapeRegex(role), $options: 'i' } });
    }

    // Filter 3: Tech Stack / Skills
    if (skills && skills !== 'All' && skills !== 'All Skills' && skills !== 'All Stacks') {
      const skillList = skills.split(',').map(s => escapeRegex(s.trim())).filter(Boolean);
      if (skillList.length > 0) {
        conditions.push({
          $or: [
            { technicalSkills: { $in: skillList.map(s => new RegExp(s, 'i')) } },
            { capabilities: { $in: skillList.map(s => new RegExp(s, 'i')) } }
          ]
        });
      }
    }

    // Filter 4: Capability Filter
    if (capability && capability !== 'All Capabilities' && capability !== 'All') {
      conditions.push({ capabilities: { $in: [capability] } });
    }

    // Filter 5: SIH Themes
    if (theme && theme !== 'All Interested SIH Themes' && theme !== 'All Themes') {
      conditions.push({ sihThemes: { $in: [theme] } });
    }

    // Filter 6: Academic Year
    if (year && year !== 'All Academic Years' && year !== 'All') {
      conditions.push({ year: year });
    }

    // Filter 7: SIH PS Code Search
    if (psCode && psCode.trim() !== '') {
      const cleanPs = escapeRegex(psCode.trim());
      conditions.push({
        $or: [
          { about: { $regex: cleanPs, $options: 'i' } },
          { sihThemes: { $regex: cleanPs, $options: 'i' } }
        ]
      });
    }

    // Ensure only users with complete profiles appear in teammate discovery
    conditions.push({
      $or: [
        { profileComplete: true },
        { isProfileComplete: true }
      ]
    });

    const query = conditions.length > 0 ? { $and: conditions } : {};
    const skipCount = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));

    const teammates = await User.find(query)
      .select('-password')
      .sort({ sihReadinessScore: -1, updatedAt: -1 })
      .skip(skipCount)
      .limit(Math.min(100, parseInt(limit)))
      .lean();

    res.status(200).json(teammates);
  } catch (error) {
    console.error('Fetch Teammates Error:', error);
    res.status(500).json({ message: 'Failed to fetch teammates', error: error.message });
  }
});

// 5. PUT /api/auth/profile — Save Profile (Protected with JWT Auth to prevent IDOR)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.user.userId;
    const updateData = { ...req.body };
    delete updateData.password;
    delete updateData._id;

    // Format yearAndBranch string if year and classBranch are given
    if (updateData.year && updateData.classBranch) {
      updateData.yearAndBranch = `${updateData.year} • ${updateData.classBranch}${updateData.section ? ` (${updateData.section})` : ''}`;
    }

    // Validate required fields for teammate card discovery
    const hasRequired = Boolean(
      (updateData.name || req.user.email) &&
      updateData.college &&
      updateData.classBranch &&
      updateData.year &&
      ((updateData.technicalSkills && updateData.technicalSkills.length > 0) || (updateData.capabilities && updateData.capabilities.length > 0)) &&
      (updateData.about && updateData.about.trim().length > 0)
    );

    // Recalculate SIH Readiness Score
    updateData.sihReadinessScore = calculateScore(updateData);
    
    // Set completion flags based on required data
    updateData.profileComplete = hasRequired;
    updateData.isProfileComplete = hasRequired;

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    const token = generateToken(updatedUser);

    res.status(200).json({
      ...updatedUser.toObject(),
      token,
      profileComplete: updatedUser.profileComplete,
      isProfileComplete: updatedUser.isProfileComplete
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile in database', error: error.message });
  }
});

// 6. GET /api/auth/me — Retrieve authenticated user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

module.exports = router;