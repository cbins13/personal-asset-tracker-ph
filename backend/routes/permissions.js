import express from 'express';
import Permission from '../models/Permission.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { sendErrorResponse, sanitizeErrorMessage } from '../utils/errorHandler.js';
import { sanitizeText } from '../utils/sanitize.js';

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
    return sendErrorResponse(res, {
      status: 500,
      context: 'Get permissions error',
      error,
      message: 'Failed to get permissions',
    });
  }
});

// Get single permission by ID
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({ success: false, error: 'Permission not found' });
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
    return sendErrorResponse(res, {
      status: 500,
      context: 'Get permission error',
      error,
      message: 'Failed to get permission',
    });
  }
});

// Create new permission
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const sanitizedName = name ? sanitizeText(name).trim().toLowerCase() : '';
    const sanitizedDescription = description ? sanitizeText(description).trim() : '';
    const sanitizedCategory = category ? sanitizeText(category).trim() : undefined;

    if (!sanitizedName || !sanitizedDescription) {
      return res.status(400).json({ success: false, error: 'Name and description are required' });
    }

    // Validate name format (resource:action)
    if (!/^[a-z0-9]+:[a-z0-9]+$/.test(sanitizedName)) {
      return res.status(400).json({
        success: false,
        error: 'Permission name must be in format "resource:action" (e.g., users:read)',
      });
    }

    // Check if permission already exists
    const existing = await Permission.findOne({ name: sanitizedName });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Permission with this name already exists' });
    }

    const permission = new Permission({
      name: sanitizedName,
      description: sanitizedDescription,
      category: sanitizedCategory || 'other',
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
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
    return sendErrorResponse(res, {
      status: 500,
      context: 'Create permission error',
      error,
      message: 'Failed to create permission',
    });
  }
});

// Update permission
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, category, isActive } = req.body;
    const sanitizedName = name ? sanitizeText(name).trim().toLowerCase() : undefined;
    const sanitizedDescription = description !== undefined ? sanitizeText(description).trim() : undefined;
    const sanitizedCategory = category !== undefined ? sanitizeText(category).trim() : undefined;
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({ success: false, error: 'Permission not found' });
    }

    // If name is being updated, validate format
    if (sanitizedName && sanitizedName !== permission.name) {
      if (!/^[a-z0-9]+:[a-z0-9]+$/.test(sanitizedName)) {
        return res.status(400).json({
          success: false,
          error: 'Permission name must be in format "resource:action" (e.g., users:read)',
        });
      }

      // Check if new name already exists
      const existing = await Permission.findOne({ name: sanitizedName });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Permission with this name already exists' });
      }

      permission.name = sanitizedName;
    }

    if (sanitizedDescription !== undefined) permission.description = sanitizedDescription;
    if (sanitizedCategory !== undefined) permission.category = sanitizedCategory;
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
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
    return sendErrorResponse(res, {
      status: 500,
      context: 'Update permission error',
      error,
      message: 'Failed to update permission',
    });
  }
});

// Delete permission
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({ success: false, error: 'Permission not found' });
    }

    // Check if permission is being used by any users
    const User = (await import('../models/User.js')).default;
    const usersWithPermission = await User.countDocuments({
      permissions: permission.name,
    });

    if (usersWithPermission > 0) {
      const details = `Cannot delete permission. It is currently assigned to ${usersWithPermission} user(s). Remove it from all users first.`;
      return res.status(400).json({
        success: false,
        error: sanitizeErrorMessage(details),
        ...(process.env.NODE_ENV === 'production' ? {} : { details }),
      });
    }

    await Permission.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Permission deleted successfully',
    });
  } catch (error) {
    return sendErrorResponse(res, {
      status: 500,
      context: 'Delete permission error',
      error,
      message: 'Failed to delete permission',
    });
  }
});

export default router;
