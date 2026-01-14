import express from 'express';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin: Get all users
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.json({
      success: true,
      users: users.map((user) => ({
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        roles: user.roles || [],
        permissions: user.permissions || [],
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      })),
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Failed to list users', details: error.message });
  }
});

// Get current user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        roles: user.roles || [],
        permissions: user.permissions || [],
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile', details: error.message });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, picture, preferences } = req.body;
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (picture) user.picture = picture;
    if (preferences) {
      // Merge preferences
      Object.keys(preferences).forEach((key) => {
        user.preferences.set(key, preferences[key]);
      });
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

export default router;
