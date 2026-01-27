import express from 'express';
import mongoose from 'mongoose';
import AccountType from '../models/AccountType.js';
import { requireAuth } from '../middleware/auth.js';
import { sendErrorResponse } from '../utils/errorHandler.js';

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
    return sendErrorResponse(res, {
      status: 500,
      context: 'Get account types error',
      error,
      message: 'Failed to get account types',
    });
  }
});

// Get single account type by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid account type ID format' });
    }

    const accountType = await AccountType.findById(req.params.id);
    if (!accountType) {
      return res.status(404).json({ success: false, error: 'Account type not found' });
    }

    const { _id, ...rest } = accountType.toObject({ versionKey: false });
    res.json({
      success: true,
      accountType: { id: _id, ...rest },
    });
  } catch (error) {
    return sendErrorResponse(res, {
      status: 500,
      context: 'Get account type error',
      error,
      message: 'Failed to get account type',
    });
  }
});

export default router;
