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

module.exports = mongoose.model('Dish', dishSchema);
