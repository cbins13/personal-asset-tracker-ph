import express from 'express';
import Category from '../models/Category.js';
import { requireAuth } from '../middleware/auth.js';

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
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get categories', details: error.message });
  }
});

export default router;
