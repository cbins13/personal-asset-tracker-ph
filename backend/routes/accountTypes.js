import express from 'express';
import AccountType from '../models/AccountType.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all account types
router.get('/', requireAuth, async (req, res) => {
  try {
    const accountTypes = await AccountType.find().sort({ type: 1 });

    res.json({
      success: true,
      accountTypes: accountTypes.map((typeDoc) => {
        const { _id, ...rest } = typeDoc.toObject({ versionKey: false });
        return { id: _id, ...rest };
      }),
    });
  } catch (error) {
    console.error('Get account types error:', error);
    res.status(500).json({ error: 'Failed to get account types', details: error.message });
  }
});

// Get single account type by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const accountType = await AccountType.findById(req.params.id);
    if (!accountType) {
      return res.status(404).json({ error: 'Account type not found' });
    }

    const { _id, ...rest } = accountType.toObject({ versionKey: false });
    res.json({
      success: true,
      accountType: { id: _id, ...rest },
    });
  } catch (error) {
    console.error('Get account type error:', error);
    res.status(500).json({ error: 'Failed to get account type', details: error.message });
  }
});

export default router;
