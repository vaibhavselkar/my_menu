const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const os = require('os');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const catererRoutes = require('./routes/caterers');
const dishRoutes = require('./routes/dishes');
const enquiryRoutes = require('./routes/enquiries');
const chatRoutes = require('./routes/chat');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
const uploadsDir = path.join(os.tmpdir(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/caterers', catererRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'CaterConnect India API is running!', status: 'OK' });
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/caterconnect';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(MONGO_URI);
  isConnected = true;
  console.log('✅ MongoDB connected');
};

// Local development: start server
if (require.main === module) {
  connectDB()
    .then(() => {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      process.exit(1);
    });
} else {
  // Vercel serverless: connect on each cold start
  connectDB().catch(err => console.error('MongoDB error:', err.message));
}

module.exports = app;
