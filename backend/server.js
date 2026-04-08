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
// Use global to cache the connection across Vercel serverless invocations.
// Without this, every request after a cold start reconnects to Atlas (1-2s penalty).
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/caterconnect';

if (!global._mongoConn) {
  global._mongoConn = { conn: null, promise: null };
}

const connectDB = async () => {
  if (global._mongoConn.conn) return global._mongoConn.conn;

  if (!global._mongoConn.promise) {
    global._mongoConn.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    }).then(m => {
      console.log('✅ MongoDB connected');
      return m;
    });
  }

  global._mongoConn.conn = await global._mongoConn.promise;
  return global._mongoConn.conn;
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
  // Vercel serverless: warm up connection immediately on module load
  connectDB().catch(err => console.error('MongoDB error:', err.message));
}

module.exports = app;
