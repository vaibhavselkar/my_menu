const express = require('express');
const router = express.Router();
const Caterer = require('../models/Caterer');
const Dish = require('../models/Dish');

// GET /api/caterers - List all caterers (with optional city filter)
router.get('/', async (req, res) => {
  try {
    const { city, search } = req.query;
    const filter = {};

    if (city) filter.city = { $regex: city, $options: 'i' };
    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const caterers = await Caterer.find(filter).select('-password').sort({ createdAt: -1 }).lean();
    res.json({ caterers });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/caterers/:id - Get single caterer with their dishes
router.get('/:id', async (req, res) => {
  try {
    const caterer = await Caterer.findById(req.params.id).select('-password').lean();
    if (!caterer) return res.status(404).json({ message: 'Caterer not found.' });

    const dishes = await Dish.find({ catererId: caterer._id, isAvailable: true }).sort({ category: 1, name: 1 });

    res.json({ caterer, dishes });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
