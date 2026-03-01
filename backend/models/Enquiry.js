const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  catererId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caterer',
    required: true
  },
  catererName: {
    type: String,
    trim: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  numberOfPlates: {
    type: Number,
    required: [true, 'Number of plates is required'],
    min: [1, 'Minimum 1 plate required']
  },
  selectedItems: [
    {
      dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
      dishName: { type: String, trim: true },
      category: { type: String, trim: true },
      pricePerPlate: { type: Number }
    }
  ],
  menuPricePerPlate: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Enquiry', enquirySchema);
