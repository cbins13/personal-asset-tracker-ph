import express from 'express';
import mongoose from 'mongoose';
import Account from '../models/Account.js';
import AccountType from '../models/AccountType.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const accountProvidersByType = {
  Wallet: [
    { id: 'cash', label: 'Cash on Hand', accent: 'bg-green-500' },
    { id: 'beep', label: 'Beep - Wallet', accent: 'bg-blue-900' },
    { id: 'gcash', label: 'GCash - Wallet', accent: 'bg-blue-500' },
    { id: 'gotyme', label: 'GoTyme - Wallet', accent: 'bg-cyan-500' },
    { id: 'grabpay', label: 'GrabPay - Wallet', accent: 'bg-emerald-500' },
    { id: 'joyride', label: 'JoyRide Pay - Wallet', accent: 'bg-indigo-600' },
    { id: 'lazada', label: 'Lazada - Wallet', accent: 'bg-pink-500' },
    { id: 'maya', label: 'Maya - Wallet', accent: 'bg-gray-900' },
  ],
  Savings: [
    { id: 'bpi', label: 'BPI - Savings', accent: 'bg-red-500' },
    { id: 'bdo', label: 'BDO - Savings', accent: 'bg-blue-600' },
    { id: 'metrobank', label: 'Metrobank - Savings', accent: 'bg-indigo-700' },
    { id: 'unionbank', label: 'UnionBank - Savings', accent: 'bg-orange-500' },
  ],
  Credit: [
    { id: 'citi', label: 'Citi - Credit', accent: 'bg-blue-700' },
    { id: 'bpi-credit', label: 'BPI - Credit', accent: 'bg-red-600' },
    { id: 'bdo-credit', label: 'BDO - Credit', accent: 'bg-blue-500' },
  ],
  Loans: [
    { id: 'atome', label: 'Atome - Loan/Credit', accent: 'bg-lime-300' },
    { id: 'billease', label: 'Billease - Loan/Credit', accent: 'bg-blue-400' },
    { id: 'cashalo', label: 'Cashalo - Loan/Credit', accent: 'bg-yellow-400' },
    { id: 'cimb', label: 'CIMB - Loan/Credit', accent: 'bg-red-500' },
    { id: 'gcash-loan', label: 'GCash - Loan/Credit', accent: 'bg-blue-500' },
    { id: 'gotyme-loan', label: 'GoTyme - Loan/Credit', accent: 'bg-cyan-500' },
    { id: 'homecredit', label: 'Home Credit - Loan/Credit', accent: 'bg-red-400' },
  ],
  Investments: [
    { id: 'mp2', label: 'MP2 - Investments', accent: 'bg-indigo-600' },
    { id: 'col', label: 'COL - Investments', accent: 'bg-gray-700' },
    { id: 'gcash-invest', label: 'GCash - Investments', accent: 'bg-blue-500' },
  ],
};

const defaultAccountTypes = [
  {
    type: 'Savings',
    data: {
      accountName: 'Savings',
      interestRate: 0,
      goalAmount: 0,
      currentBalance: 0,
    },
  },
  {
    type: 'Wallet',
    data: {
      walletName: 'Wallet',
      currentBalance: 0,
    },
  },
  {
    type: 'Investments',
    data: {
      investmentName: 'Investments',
      startingBalance: 0,
      interestRate: 0,
      startDate: new Date(),
      endDate: new Date(),
    },
  },
  {
    type: 'Credit',
    data: {
      accountName: 'Credit',
      currentBalance: 0,
    },
  },
  {
    type: 'Loans',
    data: {
      accountName: 'Loans',
      currentBalance: 0,
    },
  },
];

let ensureAccountTypesPromise = null;

async function ensureAccountTypes() {
  if (ensureAccountTypesPromise) {
    await ensureAccountTypesPromise;
    return;
  }

  ensureAccountTypesPromise = (async () => {
    const existingCount = await AccountType.countDocuments();
    if (existingCount > 0) return;

    for (const accountType of defaultAccountTypes) {
      const AccountTypeModel = AccountType.discriminators?.[accountType.type];
      if (!AccountTypeModel) continue;

      const accountTypeDoc = new AccountTypeModel(accountType.data);
      await accountTypeDoc.save();
    }
  })();

  await ensureAccountTypesPromise;
}

// Get account providers catalog
router.get('/providers', requireAuth, async (req, res) => {
  res.json({ success: true, providersByType: accountProvidersByType });
});

async function isAccountTypeAllowed(type) {
  if (!type) return false;
  await ensureAccountTypes();
  const exists = await AccountType.exists({ type });
  return !!exists;
}

// Helper functions for transaction creation (similar to transactions.js)
function getSignedAmount(amount, kind) {
  return kind === 'income' ? Math.abs(amount) : -Math.abs(amount);
}

function getLegacyType(kind) {
  if (kind === 'income') return 'credit';
  if (kind === 'expense' || kind === 'installment') return 'debit';
  return undefined;
}

// Get all accounts for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const accounts = await Account.find({
      userId: req.session.userId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      accounts: accounts.map((account) => {
        const { _id, ...rest } = account.toObject({ versionKey: false });
        return { id: _id, ...rest };
      }),
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ success: false, error: 'Failed to get accounts', details: error.message });
  }
});

// Create new account for current user
router.post('/', requireAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { accountName, type, transactions, currentBalance, addToNetWorth, providerId, providerLabel } =
      req.body;

    if (!accountName || !type) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'accountName and type are required' });
    }

    if (transactions !== undefined && !Array.isArray(transactions)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'transactions must be an array' });
    }

    const isAllowedType = await isAccountTypeAllowed(type);
    if (!isAllowedType) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: `Account type "${type}" is not supported` });
    }

    // Store the initial balance value before creating account with 0
    const initialBalance = currentBalance ?? 0;

    // Create account with balance = 0 initially
    // The balance will be set by the initial transaction if provided
    const account = new Account({
      userId: req.session.userId,
      accountName,
      type,
      currentBalance: 0,
      addToNetWorth: addToNetWorth ?? true,
      providerId,
      providerLabel,
      transactions: transactions || [],
    });

    await account.save({ session });
    await User.findByIdAndUpdate(
      req.session.userId,
      { $addToSet: { accounts: account._id } },
      { session }
    );

    // Create initial balance transaction if non-zero
    if (initialBalance !== 0) {
      // Determine transaction kind based on balance sign
      const transactionKind = initialBalance > 0 ? 'income' : 'expense';
      const transactionAmount = Math.abs(initialBalance);
      const normalizedType = getLegacyType(transactionKind);

      const transaction = new Transaction({
        userId: req.session.userId,
        accountId: account._id,
        amount: transactionAmount,
        type: normalizedType,
        transactionKind: transactionKind,
        label: 'Initial balance',
        occurredAt: new Date(),
        recordInBudget: false,
      });

      await transaction.save({ session });

      // Update account balance based on transaction
      const signedAmount = getSignedAmount(transactionAmount, transactionKind);
      account.currentBalance = (account.currentBalance || 0) + signedAmount;
      await account.save({ session });
    }

    await session.commitTransaction();

    // Reload account to get updated balance
    const updatedAccount = await Account.findById(account._id);
    const { _id, ...rest } = updatedAccount.toObject({ versionKey: false });
    res.status(201).json({
      success: true,
      account: { id: _id, ...rest },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create account error:', error);
    res.status(500).json({ success: false, error: 'Failed to create account', details: error.message });
  } finally {
    session.endSession();
  }
});

// Get single account by ID (current user only)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid account ID format' });
    }

    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });


    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    const { _id, ...rest } = account.toObject({ versionKey: false });
    res.json({
      success: true,
      account: { id: _id, ...rest },
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ success: false, error: 'Failed to get account', details: error.message });
  }
});

// Update account
router.put('/:id', requireAuth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid account ID format' });
    }

    const { accountName, type, transactions, currentBalance, addToNetWorth, providerId, providerLabel } =
      req.body;
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    if (transactions !== undefined && !Array.isArray(transactions)) {
      return res.status(400).json({ success: false, error: 'transactions must be an array' });
    }

    if (type !== undefined) {
      const isAllowedType = await isAccountTypeAllowed(type);
      if (!isAllowedType) {
        return res.status(400).json({ success: false, error: `Account type "${type}" is not supported` });
      }
      account.type = type;
    }

    if (accountName !== undefined) {
      if (!accountName.trim()) {
        return res.status(400).json({ success: false, error: 'accountName cannot be empty' });
      }
      account.accountName = accountName;
    }

    // Prevent direct currentBalance updates - balance should only change via transactions
    if (currentBalance !== undefined) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update currentBalance directly. Balance changes must be made through transactions.',
      });
    }
    if (addToNetWorth !== undefined) account.addToNetWorth = addToNetWorth;
    if (providerId !== undefined) account.providerId = providerId;
    if (providerLabel !== undefined) account.providerLabel = providerLabel;

    await account.save();

    const { _id, ...rest } = account.toObject({ versionKey: false });
    res.json({
      success: true,
      account: { id: _id, ...rest },
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ success: false, error: 'Failed to update account', details: error.message });
  }
});

// Delete account
router.delete('/:id', requireAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Invalid account ID format' });
    }

    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!account) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    // Check if account has any transactions
    const transactionCount = await Transaction.countDocuments({
      $or: [
        { accountId: account._id },
        { fromAccountId: account._id },
        { toAccountId: account._id },
      ],
    });

    if (transactionCount > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Cannot delete account with existing transactions',
        details: `This account has ${transactionCount} transaction(s). Delete or reassign all transactions before deleting the account.`,
      });
    }

    await Account.findByIdAndDelete(account._id, { session });
    await User.findByIdAndUpdate(
      req.session.userId,
      { $pull: { accounts: account._id } },
      { session }
    );

    await session.commitTransaction();
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete account', details: error.message });
  } finally {
    session.endSession();
  }
});

export default router;
