import express from 'express';
import User from '../models/User.js';
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper function to get permission details for permission names
async function getPermissionDetails(permissionNames) {
  if (!permissionNames || permissionNames.length === 0) {
    return [];
  }

  const permissions = await Permission.find({
    name: { $in: permissionNames },
  }).select('name description resource action category isActive');

  return permissionNames.map((permName) => {
    const perm = permissions.find((p) => p.name === permName);
    return perm
      ? {
          name: perm.name,
          description: perm.description,
          resource: perm.resource,
          action: perm.action,
          category: perm.category,
          isActive: perm.isActive,
        }
      : {
          name: permName,
          description: '',
          resource: permName.split(':')[0] || '',
          action: permName.split(':')[1] || '',
          category: 'other',
          isActive: false,
        };
  });
}

// Admin: Get all users
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { includePermissionDetails } = req.query;
    const users = await User.find().select('-password');

    // If includePermissionDetails is true, populate permission details
    if (includePermissionDetails === 'true') {
      // Get all unique permission names from all users
      const allPermissionNames = [
        ...new Set(users.flatMap((user) => user.permissions || [])),
      ];

      // Fetch all permission details at once
      const permissionDetailsMap = new Map();
      if (allPermissionNames.length > 0) {
        const permissions = await Permission.find({
          name: { $in: allPermissionNames },
        }).select('name description resource action category isActive');

        permissions.forEach((perm) => {
          permissionDetailsMap.set(perm.name, {
            name: perm.name,
            description: perm.description,
            resource: perm.resource,
            action: perm.action,
            category: perm.category,
            isActive: perm.isActive,
          });
        });
      }

      res.json({
        success: true,
        users: users.map((user) => ({
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          provider: user.provider,
          roles: user.roles || [],
          permissions: (user.permissions || []).map((permName) =>
            permissionDetailsMap.get(permName) || {
              name: permName,
              description: '',
              resource: permName.split(':')[0] || '',
              action: permName.split(':')[1] || '',
              category: 'other',
              isActive: false,
            }
          ),
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        })),
      });
    } else {
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
    }
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Failed to list users', details: error.message });
  }
});

// Get current user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { includePermissionDetails } = req.query;
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If includePermissionDetails is true, populate permission details
    if (includePermissionDetails === 'true') {
      const permissionDetails = await getPermissionDetails(user.permissions);

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
          permissions: permissionDetails,
        },
      });
    } else {
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
    }
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

// Admin: Get user permissions with details
router.get('/:id/permissions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('permissions');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const permissionNames = user.permissions || [];
    if (permissionNames.length === 0) {
      return res.json({
        success: true,
        permissions: [],
      });
    }

    const permissions = await Permission.find({
      name: { $in: permissionNames },
    }).select('name description resource action category isActive');

    res.json({
      success: true,
      permissions: permissions.map((perm) => ({
        id: perm._id,
        name: perm.name,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
        category: perm.category,
        isActive: perm.isActive,
      })),
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({ error: 'Failed to get user permissions', details: error.message });
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

      // Validate each role exists in Roles collection
      if (roles.length > 0) {
        const existingRoles = await Role.find({
          name: { $in: roles },
          isActive: true, // Only allow active roles
        }).select('name');

        const existingRoleNames = existingRoles.map((r) => r.name);
        const invalidRoles = roles.filter((role) => !existingRoleNames.includes(role));

        if (invalidRoles.length > 0) {
          return res.status(400).json({
            error: `Invalid or inactive roles: ${invalidRoles.join(', ')}`,
            message: 'Roles must exist in the Roles collection and be active',
          });
        }
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

      // Validate each permission exists in Permissions collection
      if (permissions.length > 0) {
        const existingPermissions = await Permission.find({
          name: { $in: permissions },
          isActive: true, // Only allow active permissions
        }).select('name');

        const existingPermissionNames = existingPermissions.map((p) => p.name);
        const invalidPermissions = permissions.filter(
          (perm) => !existingPermissionNames.includes(perm)
        );

        if (invalidPermissions.length > 0) {
          return res.status(400).json({
            error: `Invalid or inactive permissions: ${invalidPermissions.join(', ')}`,
            message: 'Permissions must exist in the Permissions collection and be active',
          });
        }
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

    // Get permission details for the response
    const permissionDetails = await getPermissionDetails(targetUser.permissions);

    res.json({
      success: true,
      user: {
        id: targetUser._id,
        email: targetUser.email,
        name: targetUser.name,
        picture: targetUser.picture,
        provider: targetUser.provider,
        roles: targetUser.roles || [],
        permissions: permissionDetails,
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
