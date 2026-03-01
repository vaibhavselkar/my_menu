const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Caterer = require('../models/Caterer');
const { protect } = require('../middleware/auth');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '7d'
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { businessName, ownerName, email, password, phone, address, city, state, description } = req.body;

    const existing = await Caterer.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    const caterer = await Caterer.create({
      businessName, ownerName, email, password, phone, address, city, state, description
    });

    const token = signToken(caterer._id);

    res.status(201).json({
      message: 'Registration successful!',
      token,
      caterer: {
        id: caterer._id,
        businessName: caterer.businessName,
        ownerName: caterer.ownerName,
        email: caterer.email,
        phone: caterer.phone,
        city: caterer.city,
        state: caterer.state
      }
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const caterer = await Caterer.findOne({ email }).select('+password');
    if (!caterer || !(await caterer.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(caterer._id);

    res.json({
      message: 'Login successful!',
      token,
      caterer: {
        id: caterer._id,
        businessName: caterer.businessName,
        ownerName: caterer.ownerName,
        email: caterer.email,
        phone: caterer.phone,
        city: caterer.city,
        state: caterer.state,
        profileImage: caterer.profileImage
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// GET /api/auth/me - Get current logged-in caterer
router.get('/me', protect, async (req, res) => {
  res.json({ caterer: req.caterer });
});

// PUT /api/auth/profile - Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { businessName, ownerName, phone, address, city, state, description } = req.body;

    const updated = await Caterer.findByIdAndUpdate(
      req.caterer._id,
      { businessName, ownerName, phone, address, city, state, description },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Profile updated successfully!', caterer: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
