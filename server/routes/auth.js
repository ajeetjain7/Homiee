const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/auth/google — Login / Register with Google
router.post('/google', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required from authentication payload.' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || 'Dev User',
        email,
        college: 'IET DAVV',
        role: 'Backend Developer'
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Backend Google Auth Error:', error);
    res.status(500).json({ message: error.message || 'Internal server error during auth' });
  }
});

// PUT /api/auth/profile — Save edited profile updates to MongoDB
router.put('/profile', async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required to update profile' });
    }

    // Finds user by MongoDB _id and updates with new fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile in database', error: error.message });
  }
});

module.exports = router;