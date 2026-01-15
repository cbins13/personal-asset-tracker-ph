import express from 'express';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all roles
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const roles = await Role.find(query).sort({ name: 1 });

    // Get permission details for each role
    const allPermissionNames = [
      ...new Set(roles.flatMap((role) => role.permissions || [])),
    ];
    const permissionMap = new Map();
    if (allPermissionNames.length > 0) {
      const permissions = await Permission.find({
        name: { $in: allPermissionNames },
      }).select('name description category');
      permissions.forEach((perm) => {
        permissionMap.set(perm.name, {
          name: perm.name,
          description: perm.description,
          category: perm.category,
        });
      });
    }

    res.json({
      success: true,
      roles: roles.map((role) => ({
        id: role._id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: (role.permissions || []).map((permName) =>
          permissionMap.get(permName) || {
            name: permName,
            description: '',
            category: 'other',
          }
        ),
        isActive: role.isActive,
        isSystemRole: role.isSystemRole,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles', details: error.message });
  }
});

// Get single role by ID
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Get permission details
    const permissions = await Permission.find({
      name: { $in: role.permissions || [] },
    }).select('name description resource action category');

    res.json({
      success: true,
      role: {
        id: role._id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: permissions.map((perm) => ({
          id: perm._id,
          name: perm.name,
          description: perm.description,
          resource: perm.resource,
          action: perm.action,
          category: perm.category,
        })),
        isActive: role.isActive,
        isSystemRole: role.isSystemRole,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to get role', details: error.message });
  }
});

// Create new role
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, displayName, description, permissions } = req.body;

    if (!name || !displayName || !description) {
      return res.status(400).json({
        error: 'Name, displayName, and description are required',
      });
    }

    // Check if role already exists
    const existing = await Role.findOne({ name: name.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Role with this name already exists' });
    }

    // Validate permissions exist
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const existingPermissions = await Permission.find({
        name: { $in: permissions },
        isActive: true,
      }).select('name');

      const existingPermissionNames = existingPermissions.map((p) => p.name);
      const invalidPermissions = permissions.filter(
        (perm) => !existingPermissionNames.includes(perm)
      );

      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          error: `Invalid or inactive permissions: ${invalidPermissions.join(', ')}`,
        });
      }
    }

    const role = new Role({
      name: name.toLowerCase(),
      displayName,
      description,
      permissions: permissions || [],
    });

    await role.save();

    // Get permission details for response
    const permissionDetails = await Permission.find({
      name: { $in: role.permissions || [] },
    }).select('name description category');

    res.status(201).json({
      success: true,
      role: {
        id: role._id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: permissionDetails.map((perm) => ({
          name: perm.name,
          description: perm.description,
          category: perm.category,
        })),
        isActive: role.isActive,
        isSystemRole: role.isSystemRole,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create role error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Role with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create role', details: error.message });
  }
});

// Update role
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, displayName, description, permissions, isActive } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Prevent modification of system roles (except isActive)
    if (role.isSystemRole && (name || displayName || description || permissions)) {
      return res.status(400).json({
        error: 'Cannot modify system role properties. Only isActive can be changed.',
      });
    }

    // If name is being updated, check for duplicates
    if (name && name.toLowerCase() !== role.name) {
      const existing = await Role.findOne({ name: name.toLowerCase() });
      if (existing) {
        return res.status(400).json({ error: 'Role with this name already exists' });
      }
      role.name = name.toLowerCase();
    }

    if (displayName !== undefined) role.displayName = displayName;
    if (description !== undefined) role.description = description;
    if (isActive !== undefined) role.isActive = isActive;

    // Validate and update permissions
    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: 'Permissions must be an array' });
      }

      if (permissions.length > 0) {
        const existingPermissions = await Permission.find({
          name: { $in: permissions },
          isActive: true,
        }).select('name');

        const existingPermissionNames = existingPermissions.map((p) => p.name);
        const invalidPermissions = permissions.filter(
          (perm) => !existingPermissionNames.includes(perm)
        );

        if (invalidPermissions.length > 0) {
          return res.status(400).json({
            error: `Invalid or inactive permissions: ${invalidPermissions.join(', ')}`,
          });
        }
      }

      role.permissions = permissions;
    }

    await role.save();

    // Get permission details for response
    const permissionDetails = await Permission.find({
      name: { $in: role.permissions || [] },
    }).select('name description category');

    res.json({
      success: true,
      role: {
        id: role._id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: permissionDetails.map((perm) => ({
          name: perm.name,
          description: perm.description,
          category: perm.category,
        })),
        isActive: role.isActive,
        isSystemRole: role.isSystemRole,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update role error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update role', details: error.message });
  }
});

// Delete role
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Prevent deletion of system roles
    if (role.isSystemRole) {
      return res.status(400).json({
        error: 'Cannot delete system roles',
      });
    }

    // Check if role is assigned to any users
    const usersWithRole = await User.countDocuments({
      roles: role.name,
    });

    if (usersWithRole > 0) {
      return res.status(400).json({
        error: `Cannot delete role. It is currently assigned to ${usersWithRole} user(s). Remove it from all users first.`,
      });
    }

    await Role.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role', details: error.message });
  }
});

export default router;
