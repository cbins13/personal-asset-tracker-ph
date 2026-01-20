import express from 'express';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function normalizeTransactionKind({ transactionKind, type } = {}) {
  if (transactionKind) return transactionKind;
  if (type === 'credit') return 'income';
  if (type === 'debit') return 'expense';
  return 'expense';
}

function getSignedAmount(amount, kind) {
  return kind === 'income' ? Math.abs(amount) : -Math.abs(amount);
}

function getLegacyType(kind) {
  if (kind === 'income') return 'credit';
  if (kind === 'expense' || kind === 'installment') return 'debit';
  return undefined;
}

const allowedKinds = ['expense', 'income', 'installment', 'transfer'];

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
    const { accountId, kind, includeAccounts } = req.query;
    const filter = { userId: req.session.userId };
    if (kind) {
      filter.transactionKind = kind;
    }
    if (accountId) {
      filter.$or = [{ accountId }, { fromAccountId: accountId }, { toAccountId: accountId }];
    }

    let query = Transaction.find(filter).sort({ occurredAt: -1, createdAt: -1 });
    if (includeAccounts === 'true') {
      query = query
        .populate('accountId', 'accountName providerLabel type')
        .populate('fromAccountId', 'accountName providerLabel type')
        .populate('toAccountId', 'accountName providerLabel type');
    }

    const transactions = await query.exec();
    res.json({
      success: true,
      transactions: transactions.map((tx) => {
        const { _id, accountId: account, fromAccountId, toAccountId, ...rest } = tx.toObject({
          versionKey: false,
        });
        const transactionKind = normalizeTransactionKind({ transactionKind: rest.transactionKind, type: rest.type });
        return {
          id: _id,
          ...rest,
          transactionKind,
          categoryLabel: rest.categoryLabel || rest.category || '',
          accountId: account && account._id ? account._id : account,
          fromAccountId: fromAccountId && fromAccountId._id ? fromAccountId._id : fromAccountId,
          toAccountId: toAccountId && toAccountId._id ? toAccountId._id : toAccountId,
          ...(account && account._id ? { account } : {}),
          ...(fromAccountId && fromAccountId._id ? { fromAccount: fromAccountId } : {}),
          ...(toAccountId && toAccountId._id ? { toAccount: toAccountId } : {}),
        };
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
    const {
      accountId,
      fromAccountId,
      toAccountId,
      amount,
      transactionKind,
      type,
      label,
      occurredAt,
      categoryId,
      categoryLabel,
      recordInBudget,
      notes,
    } = req.body;

    if (transactionKind && !allowedKinds.includes(transactionKind)) {
      return res.status(400).json({ error: 'transactionKind is invalid' });
    }

    if (amount === undefined || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const kind = normalizeTransactionKind({ transactionKind, type });

    if (kind === 'transfer') {
      if (!fromAccountId || !toAccountId) {
        return res.status(400).json({ error: 'fromAccountId and toAccountId are required for transfers' });
      }
      if (fromAccountId === toAccountId) {
        return res.status(400).json({ error: 'fromAccountId and toAccountId must be different' });
      }

      const fromAccount = await Account.findOne({ _id: fromAccountId, userId: req.session.userId });
      const toAccount = await Account.findOne({ _id: toAccountId, userId: req.session.userId });
      if (!fromAccount || !toAccount) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const transaction = new Transaction({
        userId: req.session.userId,
        fromAccountId,
        toAccountId,
        amount,
        transactionKind: kind,
        label,
        occurredAt,
        categoryId,
        categoryLabel,
        recordInBudget,
        notes,
      });

      await transaction.save();
      fromAccount.currentBalance = (fromAccount.currentBalance || 0) - Math.abs(amount);
      toAccount.currentBalance = (toAccount.currentBalance || 0) + Math.abs(amount);
      await Promise.all([fromAccount.save(), toAccount.save()]);

      const { _id, ...rest } = transaction.toObject({ versionKey: false });
      res.status(201).json({ success: true, transaction: { id: _id, ...rest } });
      return;
    }

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    const account = await Account.findOne({ _id: accountId, userId: req.session.userId });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const normalizedType = getLegacyType(kind);
    const transaction = new Transaction({
      userId: req.session.userId,
      accountId,
      amount,
      type: normalizedType,
      transactionKind: kind,
      label,
      occurredAt,
      categoryId,
      categoryLabel,
      recordInBudget,
      notes,
    });

    await transaction.save();
    const signedAmount = getSignedAmount(amount, kind);
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
    const {
      amount,
      type,
      transactionKind,
      label,
      occurredAt,
      categoryId,
      categoryLabel,
      recordInBudget,
      notes,
      accountId,
      fromAccountId,
      toAccountId,
    } = req.body;
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.session.userId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (type !== undefined && !['credit', 'debit'].includes(type)) {
      return res.status(400).json({ error: 'type must be credit or debit' });
    }

    if (transactionKind && !allowedKinds.includes(transactionKind)) {
      return res.status(400).json({ error: 'transactionKind is invalid' });
    }

    if (amount !== undefined && (Number.isNaN(Number(amount)) || Number(amount) <= 0)) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const originalKind = normalizeTransactionKind({
      transactionKind: transaction.transactionKind,
      type: transaction.type,
    });
    const nextKind = normalizeTransactionKind({
      transactionKind: transactionKind ?? transaction.transactionKind,
      type: type ?? transaction.type,
    });
    const nextAmount = amount !== undefined ? amount : transaction.amount;

    if (nextKind === 'transfer') {
      const nextFrom = fromAccountId ?? transaction.fromAccountId?.toString();
      const nextTo = toAccountId ?? transaction.toAccountId?.toString();
      if (!nextFrom || !nextTo) {
        return res.status(400).json({ error: 'fromAccountId and toAccountId are required for transfers' });
      }
      if (nextFrom === nextTo) {
        return res.status(400).json({ error: 'fromAccountId and toAccountId must be different' });
      }

      if (originalKind === 'transfer') {
        const originalFrom = transaction.fromAccountId?.toString();
        const originalTo = transaction.toAccountId?.toString();
        if (originalFrom) await adjustAccountBalance(originalFrom, req.session.userId, Math.abs(transaction.amount));
        if (originalTo) await adjustAccountBalance(originalTo, req.session.userId, -Math.abs(transaction.amount));
      } else if (transaction.accountId) {
        const originalSigned = getSignedAmount(transaction.amount, originalKind);
        await adjustAccountBalance(transaction.accountId, req.session.userId, -originalSigned);
      }

      await adjustAccountBalance(nextFrom, req.session.userId, -Math.abs(nextAmount));
      await adjustAccountBalance(nextTo, req.session.userId, Math.abs(nextAmount));

      transaction.fromAccountId = nextFrom;
      transaction.toAccountId = nextTo;
      transaction.accountId = undefined;
      transaction.transactionKind = nextKind;
      transaction.type = getLegacyType(nextKind);
    } else {
      const nextAccountId = accountId ?? transaction.accountId?.toString();
      if (!nextAccountId) {
        return res.status(400).json({ error: 'accountId is required' });
      }

      if (originalKind === 'transfer') {
        const originalFrom = transaction.fromAccountId?.toString();
        const originalTo = transaction.toAccountId?.toString();
        if (originalFrom) await adjustAccountBalance(originalFrom, req.session.userId, Math.abs(transaction.amount));
        if (originalTo) await adjustAccountBalance(originalTo, req.session.userId, -Math.abs(transaction.amount));
      } else if (transaction.accountId) {
        const originalSigned = getSignedAmount(transaction.amount, originalKind);
        await adjustAccountBalance(transaction.accountId, req.session.userId, -originalSigned);
      }

      const nextSigned = getSignedAmount(nextAmount, nextKind);
      await adjustAccountBalance(nextAccountId, req.session.userId, nextSigned);

      transaction.accountId = nextAccountId;
      transaction.fromAccountId = undefined;
      transaction.toAccountId = undefined;
      transaction.transactionKind = nextKind;
      transaction.type = getLegacyType(nextKind);
    }

    if (amount !== undefined) transaction.amount = amount;
    if (label !== undefined) transaction.label = label;
    if (occurredAt !== undefined) transaction.occurredAt = occurredAt;
    if (categoryId !== undefined) transaction.categoryId = categoryId;
    if (categoryLabel !== undefined) transaction.categoryLabel = categoryLabel;
    if (recordInBudget !== undefined) transaction.recordInBudget = recordInBudget;
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

    const kind = normalizeTransactionKind({
      transactionKind: transaction.transactionKind,
      type: transaction.type,
    });
    if (kind === 'transfer') {
      if (transaction.fromAccountId) {
        await adjustAccountBalance(transaction.fromAccountId, req.session.userId, Math.abs(transaction.amount));
      }
      if (transaction.toAccountId) {
        await adjustAccountBalance(transaction.toAccountId, req.session.userId, -Math.abs(transaction.amount));
      }
    } else if (transaction.accountId) {
      const signedAmount = getSignedAmount(transaction.amount, kind);
      await adjustAccountBalance(transaction.accountId, req.session.userId, -signedAmount);
    }
    await Transaction.deleteOne({ _id: transaction._id });

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction', details: error.message });
  }
});

export default router;
