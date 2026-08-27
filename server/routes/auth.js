const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'homiee_super_secret_key_123';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Helper to generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email, 
      profileComplete: user.profileComplete || user.isProfileComplete || false 
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
  if (user.about && user.about.trim().length > 20) score += 10;
  if (user.github || user.linkedin || user.portfolio) score += 10;
  return Math.min(score, 100);
};

// 1. GET /api/auth/google — Full Browser Redirect to Google OAuth Consent Screen
router.get('/google', async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  if (!clientId) {
    // If GOOGLE_CLIENT_ID is not configured in .env, create or fetch a standard Google User session
    // and perform full-page browser redirect to /auth/callback (prevents popup COOP errors)
    const demoGoogleEmail = `innovator.google_${Date.now()}@gmail.com`;
    let user = await User.create({
      name: 'Google Innovator',
      email: demoGoogleEmail,
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
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

    const token = generateToken(user);
    const userSafe = user.toObject ? user.toObject() : user;
    delete userSafe.password;

    const redirectTarget = `${CLIENT_URL}/auth/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userSafe))}&isNew=true`;
    return res.redirect(redirectTarget);
  }

  const scope = encodeURIComponent('openid profile email');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  res.redirect(googleAuthUrl);
});

// 2. GET /api/auth/google/callback — Handle Google OAuth Code & Issue JWT
router.get('/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error || !code) {
      return res.redirect(`${CLIENT_URL}/login?error=${encodeURIComponent(error || 'Google login was cancelled')}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

    // Exchange authorization code for tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const { access_token } = tokenRes.data;

    // Fetch Google User Profile
    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const googleUser = profileRes.data;
    const normalizedEmail = (googleUser.email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.redirect(`${CLIENT_URL}/login?error=No+email+provided+by+Google`);
    }

    let user = await User.findOne({ email: normalizedEmail });
    let isFirstTime = false;

    const googlePhoto = googleUser.picture || '';

    if (!user) {
      isFirstTime = true;
      user = await User.create({
        name: googleUser.name || 'Student Innovator',
        email: normalizedEmail,
        photoUrl: googlePhoto,
        avatar: googlePhoto,
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
    } else if (googlePhoto && (!user.photoUrl || !user.avatar)) {
      user.photoUrl = googlePhoto;
      user.avatar = googlePhoto;
      await user.save();
    }

    const token = generateToken(user);
    const userSafe = user.toObject ? user.toObject() : user;
    delete userSafe.password;

    // Redirect to frontend OAuth callback with token and user profile
    const redirectTarget = `${CLIENT_URL}/oauth/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userSafe))}&isNew=${isFirstTime || (!user.profileComplete && !user.isProfileComplete)}`;
    res.redirect(redirectTarget);
  } catch (err) {
    console.error('Google Callback Error:', err.response?.data || err.message);
    res.redirect(`${CLIENT_URL}/login?error=Google+authentication+failed.+Please+try+again.`);
  }
});

// 3. POST /api/auth/google — Frontend Firebase/Google Token Authentication
router.post('/google', async (req, res) => {
  try {
    const { token: googleToken, email, name, avatar, photoUrl, picture, googleId, uid, sub } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required from authentication payload.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const gId = (googleId || uid || sub || '').trim();
    const userPhoto = (photoUrl || picture || avatar || '').trim();

    // 1. Check if user exists by stable Google ID or normalized Email
    let user = null;
    if (gId) {
      user = await User.findOne({ $or: [{ googleId: gId }, { email: normalizedEmail }] });
    } else {
      user = await User.findOne({ email: normalizedEmail });
    }

    let isNewUser = false;

    if (!user) {
      // 2. Create new user if not found in MongoDB
      isNewUser = true;
      user = await User.create({
        name: name || 'Student Innovator',
        email: normalizedEmail,
        googleId: gId,
        photoUrl: userPhoto,
        avatar: userPhoto,
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
      // 3. Update existing user's googleId or photoUrl if missing
      let needsSave = false;
      if (gId && !user.googleId) {
        user.googleId = gId;
        needsSave = true;
      }
      if (userPhoto && (!user.photoUrl || !user.avatar)) {
        user.photoUrl = userPhoto;
        user.avatar = userPhoto;
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
    res.status(500).json({ message: error.message || 'Internal server error during auth' });
  }
});

// 4. POST /api/auth/register — Email & Password Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
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

// 5. POST /api/auth/login — Email & Password Login
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

// 6. GET /api/auth/teammates — Retrieve Teammate Profiles with Multi-Condition AND Filters
router.get('/teammates', async (req, res) => {
  try {
    const { search, role, theme, year, capability, gender, skills, psCode } = req.query;
    let conditions = [];

    // General text search
    if (search && search.trim() !== '') {
      const cleanSearch = search.trim();
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

    // Filter 1: Gender Filter (Male / Female / Other / All)
    if (gender && gender !== 'All' && gender !== 'All Genders') {
      conditions.push({ gender: gender });
    }

    // Filter 2: Technical Role
    if (role && role !== 'All Technical Roles' && role !== 'All Open Positions' && role !== 'All Roles') {
      conditions.push({ primaryRole: { $regex: role, $options: 'i' } });
    }

    // Filter 3: Tech Stack / Skills (supports comma-separated multi-select or single)
    if (skills && skills !== 'All' && skills !== 'All Skills' && skills !== 'All Stacks') {
      const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
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
      const cleanPs = psCode.trim();
      conditions.push({
        $or: [
          { about: { $regex: cleanPs, $options: 'i' } },
          { sihThemes: { $regex: cleanPs, $options: 'i' } }
        ]
      });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    const teammates = await User.find(query)
      .select('-password')
      .sort({ sihReadinessScore: -1, updatedAt: -1 })
      .lean();

    res.status(200).json(teammates);
  } catch (error) {
    console.error('Fetch Teammates Error:', error);
    res.status(500).json({ message: 'Failed to fetch teammates', error: error.message });
  }
});

// 7. PUT /api/auth/profile — Save Profile, mark complete, and issue updated token
router.put('/profile', async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required to update profile' });
    }

    // Format yearAndBranch string if year and classBranch are given
    if (updateData.year && updateData.classBranch) {
      updateData.yearAndBranch = `${updateData.year} • ${updateData.classBranch}${updateData.section ? ` (${updateData.section})` : ''}`;
    }

    // Recalculate SIH Readiness Score
    updateData.sihReadinessScore = calculateScore(updateData);
    
    // Set both completion flags to true
    updateData.profileComplete = true;
    updateData.isProfileComplete = true;

    // Finds user by MongoDB _id and updates with new fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    const token = generateToken(updatedUser);

    res.status(200).json({
      ...updatedUser.toObject(),
      token
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile in database', error: error.message });
  }
});

// 8. GET /api/auth/me — Retrieve authenticated user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

module.exports = router;