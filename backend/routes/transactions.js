import express from 'express';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function getSignedAmount(amount, type) {
  return type === 'debit' ? -Math.abs(amount) : Math.abs(amount);
}

async function adjustAccountBalance(accountId, userId, delta) {
  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) {
    const error = new Error('Account not found');
    error.status = 404;
    throw error;
  }
  account.currentBalance = (account.currentBalance || 0) + delta;
  await account.save();
  return account;
}

// Get transactions (optionally filter by accountId)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { accountId } = req.query;
    const filter = { userId: req.session.userId };
    if (accountId) filter.accountId = accountId;

    const transactions = await Transaction.find(filter).sort({ occurredAt: -1, createdAt: -1 });
    res.json({
      success: true,
      transactions: transactions.map((tx) => {
        const { _id, ...rest } = tx.toObject({ versionKey: false });
        return { id: _id, ...rest };
      }),
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions', details: error.message });
  }
});

// Create transaction
router.post('/', requireAuth, async (req, res) => {
  try {
    const { accountId, amount, type, label, occurredAt, category, notes } = req.body;
    if (!accountId || amount === undefined || !type) {
      return res.status(400).json({ error: 'accountId, amount, and type are required' });
    }
    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({ error: 'type must be credit or debit' });
    }

    const account = await Account.findOne({ _id: accountId, userId: req.session.userId });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const transaction = new Transaction({
      userId: req.session.userId,
      accountId,
      amount,
      type,
      label,
      occurredAt,
      category,
      notes,
    });

    await transaction.save();
    const signedAmount = getSignedAmount(amount, type);
    account.currentBalance = (account.currentBalance || 0) + signedAmount;
    await account.save();

    const { _id, ...rest } = transaction.toObject({ versionKey: false });
    res.status(201).json({ success: true, transaction: { id: _id, ...rest } });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction', details: error.message });
  }
});

// Update transaction
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { amount, type, label, occurredAt, category, notes, accountId } = req.body;
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.session.userId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (type !== undefined && !['credit', 'debit'].includes(type)) {
      return res.status(400).json({ error: 'type must be credit or debit' });
    }

    const originalSigned = getSignedAmount(transaction.amount, transaction.type);
    const nextAmount = amount !== undefined ? amount : transaction.amount;
    const nextType = type !== undefined ? type : transaction.type;
    const nextSigned = getSignedAmount(nextAmount, nextType);

    const originalAccountId = transaction.accountId.toString();
    const nextAccountId = accountId !== undefined ? accountId : originalAccountId;

    if (nextAccountId !== originalAccountId) {
      await adjustAccountBalance(originalAccountId, req.session.userId, -originalSigned);
      await adjustAccountBalance(nextAccountId, req.session.userId, nextSigned);
      transaction.accountId = nextAccountId;
    } else if (nextSigned !== originalSigned) {
      await adjustAccountBalance(originalAccountId, req.session.userId, nextSigned - originalSigned);
    }

    if (amount !== undefined) transaction.amount = amount;
    if (type !== undefined) transaction.type = type;
    if (label !== undefined) transaction.label = label;
    if (occurredAt !== undefined) transaction.occurredAt = occurredAt;
    if (category !== undefined) transaction.category = category;
    if (notes !== undefined) transaction.notes = notes;

    await transaction.save();

    const { _id, ...rest } = transaction.toObject({ versionKey: false });
    res.json({ success: true, transaction: { id: _id, ...rest } });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction', details: error.message });
  }
});

// Delete transaction
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.session.userId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const signedAmount = getSignedAmount(transaction.amount, transaction.type);
    await adjustAccountBalance(transaction.accountId, req.session.userId, -signedAmount);
    await Transaction.deleteOne({ _id: transaction._id });

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction', details: error.message });
  }
});

export default router;
