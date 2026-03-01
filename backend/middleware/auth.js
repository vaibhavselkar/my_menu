const jwt = require('jsonwebtoken');
const Caterer = require('../models/Caterer');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const caterer = await Caterer.findById(decoded.id).select('-password');

    if (!caterer) {
      return res.status(401).json({ message: 'Token is invalid or caterer no longer exists.' });
    }

    req.caterer = caterer;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = { protect };
