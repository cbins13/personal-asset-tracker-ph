import express from 'express';
import Category from '../models/Category.js';
import { requireAuth } from '../middleware/auth.js';
import { sendErrorResponse } from '../utils/errorHandler.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ label: 1 });
    res.json({
      success: true,
      categories: categories.map((category) => {
        const { _id, ...rest } = category.toObject({ versionKey: false });
        return { id: _id, ...rest };
      }),
    });
  } catch (error) {
    return sendErrorResponse(res, {
      status: 500,
      context: 'Get categories error',
      error,
      message: 'Failed to get categories',
    });
  }
});

export default router;
