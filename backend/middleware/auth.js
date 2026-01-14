import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is authenticated (session-based)
export const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
};

// Middleware to require admin role (session-based)
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.session.userId).select('roles');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const roles = user.roles || [];
    if (!roles.includes('admin')) {
      return res.status(403).json({ error: 'Admin role required' });
    }

    req.currentUser = user;
    next();
  } catch (err) {
    console.error('requireAdmin error:', err);
    return res.status(500).json({ error: 'Failed to verify admin role' });
  }
};
