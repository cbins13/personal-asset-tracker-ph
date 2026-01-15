import express from 'express';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { VALID_ROLES, VALID_PERMISSIONS } from '../constants/rbac.js';

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

// Update user profile (must come before /:id route)
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

// Admin: Update user roles and permissions
// IMPORTANT: This route must come AFTER /profile to avoid conflicts
// Route: PUT /api/users/:id
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { roles, permissions, isActive } = req.body;
    const currentAdminId = req.session.userId;

    // Find the target user
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Security check: Prevent admin from removing their own admin role
    if (id === currentAdminId.toString()) {
      if (roles && Array.isArray(roles) && !roles.includes('admin')) {
        return res.status(400).json({
          error: 'Cannot remove your own admin role',
        });
      }
    }

    // Validate and update roles
    if (roles !== undefined) {
      if (!Array.isArray(roles)) {
        return res.status(400).json({ error: 'Roles must be an array' });
      }

      // Validate each role
      const invalidRoles = roles.filter((role) => !VALID_ROLES.includes(role));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          error: `Invalid roles: ${invalidRoles.join(', ')}`,
          validRoles: VALID_ROLES,
        });
      }

      // Security check: Prevent removing the last admin
      if (roles.length > 0 && !roles.includes('admin')) {
        const adminCount = await User.countDocuments({
          roles: 'admin',
          _id: { $ne: id },
        });

        if (adminCount === 0) {
          return res.status(400).json({
            error: 'Cannot remove the last admin. At least one admin must remain.',
          });
        }
      }

      targetUser.roles = roles;
    }

    // Validate and update permissions
    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: 'Permissions must be an array' });
      }

      // Validate each permission
      const invalidPermissions = permissions.filter(
        (perm) => !VALID_PERMISSIONS.includes(perm)
      );
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
          validPermissions: VALID_PERMISSIONS,
        });
      }

      targetUser.permissions = permissions;
    }

    // Update isActive status
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }
      
      // Prevent deactivating the last admin
      if (isActive === false && targetUser.roles.includes('admin')) {
        const adminCount = await User.countDocuments({
          roles: 'admin',
          isActive: true,
          _id: { $ne: id },
        });

        if (adminCount === 0) {
          return res.status(400).json({
            error: 'Cannot deactivate the last admin. At least one active admin must remain.',
          });
        }
      }

      targetUser.isActive = isActive;
    }

    await targetUser.save();

    res.json({
      success: true,
      user: {
        id: targetUser._id,
        email: targetUser.email,
        name: targetUser.name,
        picture: targetUser.picture,
        provider: targetUser.provider,
        roles: targetUser.roles || [],
        permissions: targetUser.permissions || [],
        isActive: targetUser.isActive,
        createdAt: targetUser.createdAt,
        lastLogin: targetUser.lastLogin,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      details: error.message,
    });
  }
});

export default router;
