const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const mongoose = require('mongoose');
const Dish = require('../models/Dish');
const { protect } = require('../middleware/auth');

// Setup multer for image uploads
// Use os.tmpdir() so it works on Vercel (/tmp) and Windows locally
const uploadDir = path.join(os.tmpdir(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `dish_${Date.now()}_${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  }
});

// GET /api/dishes/all - Public: all available dishes with caterer info
router.get('/all', async (req, res) => {
  try {
    console.log('Fetching all available dishes...');
    const dishes = await Dish.find({ isAvailable: true })
      .populate('catererId', 'businessName city phone _id')
      .sort({ category: 1, name: 1 })
      .lean();
    console.log(`Found ${dishes.length} dishes`);
    // Cache for 2 minutes on CDN, serve stale for up to 10 minutes while revalidating
    res.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    res.json({ dishes });
  } catch (err) {
    console.error('Error fetching dishes:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/dishes/test - Test endpoint to debug database connection
router.get('/test', async (req, res) => {
  try {
    console.log('Testing database connection...');
    const dishCount = await Dish.countDocuments();
    const catererCount = await mongoose.model('Caterer').countDocuments();
    res.json({ 
      message: 'Database connection working',
      dishCount,
      catererCount
    });
  } catch (err) {
    console.error('Database test failed:', err);
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
});

// GET /api/dishes/my - Get current caterer's dishes (protected)
router.get('/my', protect, async (req, res) => {
  try {
    const dishes = await Dish.find({ catererId: req.caterer._id }).sort({ category: 1, name: 1 }).lean();
    res.json({ dishes });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/dishes - Add a new dish (protected)
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { name, category, pricePerPlate, description, isVeg } = req.body;

    const dish = await Dish.create({
      catererId: req.caterer._id,
      name,
      category,
      pricePerPlate: Number(pricePerPlate),
      description,
      isVeg: isVeg === 'true' || isVeg === true,
      image: req.file ? `/uploads/${req.file.filename}` : ''
    });

    res.status(201).json({ message: 'Dish added successfully!', dish });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/dishes/:id - Update a dish (protected)
router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const dish = await Dish.findOne({ _id: req.params.id, catererId: req.caterer._id });
    if (!dish) return res.status(404).json({ message: 'Dish not found or unauthorized.' });

    const { name, category, pricePerPlate, description, isVeg, isAvailable } = req.body;

    dish.name = name || dish.name;
    dish.category = category || dish.category;
    dish.pricePerPlate = pricePerPlate ? Number(pricePerPlate) : dish.pricePerPlate;
    dish.description = description !== undefined ? description : dish.description;
    dish.isVeg = isVeg !== undefined ? (isVeg === 'true' || isVeg === true) : dish.isVeg;
    dish.isAvailable = isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : dish.isAvailable;

    if (req.file) {
      // Delete old image if exists
      if (dish.image) {
        const oldPath = path.join(__dirname, '..', dish.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      dish.image = `/uploads/${req.file.filename}`;
    }

    await dish.save();
    res.json({ message: 'Dish updated successfully!', dish });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/dishes/:id - Delete a dish (protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    const dish = await Dish.findOne({ _id: req.params.id, catererId: req.caterer._id });
    if (!dish) return res.status(404).json({ message: 'Dish not found or unauthorized.' });

    // Delete image file if exists
    if (dish.image) {
      const imgPath = path.join(__dirname, '..', dish.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await dish.deleteOne();
    res.json({ message: 'Dish deleted successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
