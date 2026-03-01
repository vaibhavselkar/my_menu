const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const Caterer = require('../models/Caterer');
const { protect } = require('../middleware/auth');

// POST /api/enquiries — Public: customer submits an enquiry
router.post('/', async (req, res) => {
  try {
    const {
      catererId, customerName, customerPhone, eventDate,
      numberOfPlates, selectedItems, notes
    } = req.body;

    if (!catererId || !customerName || !customerPhone || !eventDate || !numberOfPlates) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    if (!selectedItems || selectedItems.length === 0) {
      return res.status(400).json({ message: 'Please select at least one item.' });
    }

    const caterer = await Caterer.findById(catererId).select('businessName');
    if (!caterer) return res.status(404).json({ message: 'Caterer not found.' });

    const menuPricePerPlate = selectedItems.reduce((sum, item) => sum + (item.pricePerPlate || 0), 0);
    const totalPrice = menuPricePerPlate * Number(numberOfPlates);

    const enquiry = await Enquiry.create({
      catererId,
      catererName: caterer.businessName,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      eventDate: new Date(eventDate),
      numberOfPlates: Number(numberOfPlates),
      selectedItems,
      menuPricePerPlate,
      totalPrice,
      notes: notes || ''
    });

    res.status(201).json({ message: 'Enquiry submitted successfully!', enquiry });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// GET /api/enquiries/my — Protected: caterer views their enquiries
router.get('/my', protect, async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ catererId: req.caterer._id })
      .sort({ createdAt: -1 });
    res.json({ enquiries });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/enquiries/:id/status — Protected: caterer updates enquiry status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const enquiry = await Enquiry.findOne({ _id: req.params.id, catererId: req.caterer._id });
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found or unauthorized.' });

    enquiry.status = status;
    await enquiry.save();

    res.json({ message: 'Status updated.', enquiry });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
