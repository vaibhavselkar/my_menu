const mongoose = require('mongoose');

const CATEGORIES = [
  'Indian Main Course',
  'Breads',
  'Rice',
  'Starters',
  'Chinese',
  'Sweets',
  'Desserts',
  'Beverages'
];

const dishSchema = new mongoose.Schema({
  catererId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caterer',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Dish name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: CATEGORIES
  },
  pricePerPlate: {
    type: Number,
    required: [true, 'Price per plate is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  isVeg: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for fast queries
// Most common query: filter by isAvailable, sort by category + name
dishSchema.index({ isAvailable: 1, category: 1, name: 1 });
// Dashboard: fetch all dishes for a caterer
dishSchema.index({ catererId: 1, isAvailable: 1 });
// Chat AI route: filter by isVeg within available dishes
dishSchema.index({ isAvailable: 1, isVeg: 1 });

module.exports = mongoose.model('Dish', dishSchema);
