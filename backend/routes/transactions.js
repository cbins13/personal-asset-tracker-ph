import express from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import { requireAuth } from '../middleware/auth.js';
import { sendErrorResponse } from '../utils/errorHandler.js';
import { sanitizeText } from '../utils/sanitize.js';

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

async function adjustAccountBalance(accountId, userId, delta, session = null) {
  const query = Account.findOne({ _id: accountId, userId });
  if (session) {
    query.session(session);
  }
  const account = await query;
  if (!account) {
    const error = new Error('Account not found');
    error.status = 404;
    throw error;
  }
  account.currentBalance = (account.currentBalance || 0) + delta;
  if (session) {
    await account.save({ session });
  } else {
    await account.save();
  }
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
    return sendErrorResponse(res, {
      status: 500,
      context: 'Get transactions error',
      error,
      message: 'Failed to get transactions',
    });
  }
});

// Create transaction
router.post('/', requireAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

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
    const sanitizedLabel = label ? sanitizeText(label).trim() : undefined;
    const sanitizedNotes = notes ? sanitizeText(notes).trim() : undefined;
    const isCategoryIdValid = !!categoryId && mongoose.Types.ObjectId.isValid(categoryId);
    const normalizedCategoryId = isCategoryIdValid ? categoryId : undefined;
    const normalizedCategoryLabel = categoryLabel || (isCategoryIdValid ? undefined : categoryId);
    const sanitizedCategoryLabel = normalizedCategoryLabel ? sanitizeText(normalizedCategoryLabel).trim() : undefined;

    if (transactionKind && !allowedKinds.includes(transactionKind)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'transactionKind is invalid' });
    }

    if (amount === undefined || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'amount must be a positive number' });
    }

    const kind = normalizeTransactionKind({ transactionKind, type });

    if (kind === 'transfer') {
      if (!fromAccountId || !toAccountId) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: 'fromAccountId and toAccountId are required for transfers' });
      }
      if (fromAccountId === toAccountId) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: 'fromAccountId and toAccountId must be different' });
      }

      // Validate ObjectId formats
      if (!mongoose.Types.ObjectId.isValid(fromAccountId) || !mongoose.Types.ObjectId.isValid(toAccountId)) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: 'Invalid account ID format' });
      }

      const fromAccount = await Account.findOne({ _id: fromAccountId, userId: req.session.userId });
      const toAccount = await Account.findOne({ _id: toAccountId, userId: req.session.userId });
      if (!fromAccount || !toAccount) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, error: 'Account not found' });
      }

      const transaction = new Transaction({
        userId: req.session.userId,
        fromAccountId,
        toAccountId,
        amount,
        transactionKind: kind,
        label: sanitizedLabel,
        occurredAt,
        categoryId: normalizedCategoryId,
        categoryLabel: sanitizedCategoryLabel,
        recordInBudget,
        notes: sanitizedNotes,
      });

      await transaction.save({ session });
      fromAccount.currentBalance = (fromAccount.currentBalance || 0) - Math.abs(amount);
      toAccount.currentBalance = (toAccount.currentBalance || 0) + Math.abs(amount);
      await Promise.all([fromAccount.save({ session }), toAccount.save({ session })]);

      await session.commitTransaction();

      const { _id, ...rest } = transaction.toObject({ versionKey: false });
      res.status(201).json({ success: true, transaction: { id: _id, ...rest } });
      return;
    }

    if (!accountId) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'accountId is required' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Invalid account ID format' });
    }

    const account = await Account.findOne({ _id: accountId, userId: req.session.userId });
    if (!account) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    const normalizedType = getLegacyType(kind);
    const transaction = new Transaction({
      userId: req.session.userId,
      accountId,
      amount,
      type: normalizedType,
      transactionKind: kind,
      label: sanitizedLabel,
      occurredAt,
      categoryId: normalizedCategoryId,
      categoryLabel: sanitizedCategoryLabel,
      recordInBudget,
      notes: sanitizedNotes,
    });

    await transaction.save({ session });
    const signedAmount = getSignedAmount(amount, kind);
    account.currentBalance = (account.currentBalance || 0) + signedAmount;
    await account.save({ session });

    await session.commitTransaction();

    const { _id, ...rest } = transaction.toObject({ versionKey: false });
    res.status(201).json({ success: true, transaction: { id: _id, ...rest } });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(res, {
      status: 500,
      context: 'Create transaction error',
      error,
      message: 'Failed to create transaction',
    });
  } finally {
    session.endSession();
  }
});

// Update transaction
router.put('/:id', requireAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Invalid transaction ID format' });
    }

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
    const sanitizedLabel = label !== undefined ? sanitizeText(label).trim() : undefined;
    const sanitizedNotes = notes !== undefined ? sanitizeText(notes).trim() : undefined;
    const sanitizedCategoryLabel = categoryLabel !== undefined ? sanitizeText(categoryLabel).trim() : undefined;
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.session.userId });
    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    if (type !== undefined && !['credit', 'debit'].includes(type)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'type must be credit or debit' });
    }

    if (transactionKind && !allowedKinds.includes(transactionKind)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'transactionKind is invalid' });
    }

    if (amount !== undefined && (Number.isNaN(Number(amount)) || Number(amount) <= 0)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'amount must be a positive number' });
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
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: 'fromAccountId and toAccountId are required for transfers' });
      }
      if (nextFrom === nextTo) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: 'fromAccountId and toAccountId must be different' });
      }

      // Validate ObjectId formats
      if (!mongoose.Types.ObjectId.isValid(nextFrom) || !mongoose.Types.ObjectId.isValid(nextTo)) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: 'Invalid account ID format' });
      }

      if (originalKind === 'transfer') {
        const originalFrom = transaction.fromAccountId?.toString();
        const originalTo = transaction.toAccountId?.toString();
        if (originalFrom) await adjustAccountBalance(originalFrom, req.session.userId, Math.abs(transaction.amount), session);
        if (originalTo) await adjustAccountBalance(originalTo, req.session.userId, -Math.abs(transaction.amount), session);
      } else if (transaction.accountId) {
        const originalSigned = getSignedAmount(transaction.amount, originalKind);
        // Use string format for consistency
        const originalAccountId = transaction.accountId.toString();
        await adjustAccountBalance(originalAccountId, req.session.userId, -originalSigned, session);
      }

      await adjustAccountBalance(nextFrom, req.session.userId, -Math.abs(nextAmount), session);
      await adjustAccountBalance(nextTo, req.session.userId, Math.abs(nextAmount), session);

      transaction.fromAccountId = nextFrom;
      transaction.toAccountId = nextTo;
      transaction.accountId = undefined;
      transaction.transactionKind = nextKind;
      transaction.type = getLegacyType(nextKind);
    } else {
      const nextAccountId = accountId ?? transaction.accountId?.toString();
      if (!nextAccountId) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: 'accountId is required' });
      }

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(nextAccountId)) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: 'Invalid account ID format' });
      }

      if (originalKind === 'transfer') {
        const originalFrom = transaction.fromAccountId?.toString();
        const originalTo = transaction.toAccountId?.toString();
        if (originalFrom) await adjustAccountBalance(originalFrom, req.session.userId, Math.abs(transaction.amount), session);
        if (originalTo) await adjustAccountBalance(originalTo, req.session.userId, -Math.abs(transaction.amount), session);
      } else if (transaction.accountId) {
        const originalSigned = getSignedAmount(transaction.amount, originalKind);
        // Use string format for consistency
        const originalAccountId = transaction.accountId.toString();
        await adjustAccountBalance(originalAccountId, req.session.userId, -originalSigned, session);
      }

      const nextSigned = getSignedAmount(nextAmount, nextKind);
      await adjustAccountBalance(nextAccountId, req.session.userId, nextSigned, session);

      transaction.accountId = nextAccountId;
      transaction.fromAccountId = undefined;
      transaction.toAccountId = undefined;
      transaction.transactionKind = nextKind;
      transaction.type = getLegacyType(nextKind);
    }

    if (amount !== undefined) transaction.amount = amount;
    if (sanitizedLabel !== undefined) transaction.label = sanitizedLabel;
    if (occurredAt !== undefined) transaction.occurredAt = occurredAt;
    if (categoryId !== undefined) transaction.categoryId = categoryId;
    if (sanitizedCategoryLabel !== undefined) transaction.categoryLabel = sanitizedCategoryLabel;
    if (recordInBudget !== undefined) transaction.recordInBudget = recordInBudget;
    if (sanitizedNotes !== undefined) transaction.notes = sanitizedNotes;

    await transaction.save({ session });

    await session.commitTransaction();

    const { _id, ...rest } = transaction.toObject({ versionKey: false });
    res.json({ success: true, transaction: { id: _id, ...rest } });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(res, {
      status: 500,
      context: 'Update transaction error',
      error,
      message: 'Failed to update transaction',
    });
  } finally {
    session.endSession();
  }
});

// Delete transaction
router.delete('/:id', requireAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Invalid transaction ID format' });
    }

    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.session.userId });
    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    const kind = normalizeTransactionKind({
      transactionKind: transaction.transactionKind,
      type: transaction.type,
    });
    if (kind === 'transfer') {
      if (transaction.fromAccountId) {
        await adjustAccountBalance(transaction.fromAccountId, req.session.userId, Math.abs(transaction.amount), session);
      }
      if (transaction.toAccountId) {
        await adjustAccountBalance(transaction.toAccountId, req.session.userId, -Math.abs(transaction.amount), session);
      }
    } else if (transaction.accountId) {
      const signedAmount = getSignedAmount(transaction.amount, kind);
      await adjustAccountBalance(transaction.accountId, req.session.userId, -signedAmount, session);
    }
    await Transaction.deleteOne({ _id: transaction._id }, { session });

    await session.commitTransaction();

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(res, {
      status: 500,
      context: 'Delete transaction error',
      error,
      message: 'Failed to delete transaction',
    });
  } finally {
    session.endSession();
  }
});

export default router;
