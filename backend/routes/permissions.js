import express from 'express';
import Permission from '../models/Permission.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all permissions
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const permissions = await Permission.find(query).sort({ name: 1 });

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
        createdAt: perm.createdAt,
        updatedAt: perm.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to get permissions', details: error.message });
  }
});

// Get single permission by ID
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    res.json({
      success: true,
      permission: {
        id: permission._id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        category: permission.category,
        isActive: permission.isActive,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get permission error:', error);
    res.status(500).json({ error: 'Failed to get permission', details: error.message });
  }
});

// Create new permission
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    // Validate name format (resource:action)
    if (!/^[a-z0-9]+:[a-z0-9]+$/.test(name)) {
      return res.status(400).json({
        error: 'Permission name must be in format "resource:action" (e.g., users:read)',
      });
    }

    // Check if permission already exists
    const existing = await Permission.findOne({ name: name.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Permission with this name already exists' });
    }

    const permission = new Permission({
      name: name.toLowerCase(),
      description,
      category: category || 'other',
    });

    await permission.save();

    res.status(201).json({
      success: true,
      permission: {
        id: permission._id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        category: permission.category,
        isActive: permission.isActive,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create permission error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create permission', details: error.message });
  }
});

// Update permission
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, category, isActive } = req.body;
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // If name is being updated, validate format
    if (name && name !== permission.name) {
      if (!/^[a-z0-9]+:[a-z0-9]+$/.test(name)) {
        return res.status(400).json({
          error: 'Permission name must be in format "resource:action" (e.g., users:read)',
        });
      }

      // Check if new name already exists
      const existing = await Permission.findOne({ name: name.toLowerCase() });
      if (existing) {
        return res.status(400).json({ error: 'Permission with this name already exists' });
      }

      permission.name = name.toLowerCase();
    }

    if (description !== undefined) permission.description = description;
    if (category !== undefined) permission.category = category;
    if (isActive !== undefined) permission.isActive = isActive;

    await permission.save();

    res.json({
      success: true,
      permission: {
        id: permission._id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        category: permission.category,
        isActive: permission.isActive,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update permission error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update permission', details: error.message });
  }
});

// Delete permission
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Check if permission is being used by any users
    const User = (await import('../models/User.js')).default;
    const usersWithPermission = await User.countDocuments({
      permissions: permission.name,
    });

    if (usersWithPermission > 0) {
      return res.status(400).json({
        error: `Cannot delete permission. It is currently assigned to ${usersWithPermission} user(s). Remove it from all users first.`,
      });
    }

    await Permission.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Permission deleted successfully',
    });
  } catch (error) {
    console.error('Delete permission error:', error);
    res.status(500).json({ error: 'Failed to delete permission', details: error.message });
  }
});

export default router;
