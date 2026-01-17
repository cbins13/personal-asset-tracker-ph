import express from 'express';
import Account from '../models/Account.js';
import AccountType from '../models/AccountType.js';
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

// Get account providers catalog
router.get('/providers', requireAuth, async (req, res) => {
  res.json({ success: true, providersByType: accountProvidersByType });
});

async function isAccountTypeAllowed(type) {
  if (!type) return false;
  const exists = await AccountType.exists({ type });
  return !!exists;
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
    res.status(500).json({ error: 'Failed to get accounts', details: error.message });
  }
});

// Create new account for current user
router.post('/', requireAuth, async (req, res) => {
  try {
    const { accountName, type, transactions, currentBalance, addToNetWorth, providerId, providerLabel } =
      req.body;

    if (!accountName || !type) {
      return res.status(400).json({ error: 'accountName and type are required' });
    }

    if (transactions !== undefined && !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'transactions must be an array' });
    }

    const isAllowedType = await isAccountTypeAllowed(type);
    if (!isAllowedType) {
      return res.status(400).json({ error: `Account type "${type}" is not supported` });
    }

    const account = new Account({
      userId: req.session.userId,
      accountName,
      type,
      currentBalance: currentBalance ?? 0,
      addToNetWorth: addToNetWorth ?? true,
      providerId,
      providerLabel,
      transactions: transactions || [],
    });

    await account.save();
    await User.findByIdAndUpdate(req.session.userId, {
      $addToSet: { accounts: account._id },
    });

    const { _id, ...rest } = account.toObject({ versionKey: false });
    res.status(201).json({
      success: true,
      account: { id: _id, ...rest },
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Failed to create account', details: error.message });
  }
});

// Get single account by ID (current user only)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const { _id, ...rest } = account.toObject({ versionKey: false });
    res.json({
      success: true,
      account: { id: _id, ...rest },
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Failed to get account', details: error.message });
  }
});

// Update account
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { accountName, type, transactions, currentBalance, addToNetWorth, providerId, providerLabel } =
      req.body;
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (transactions !== undefined && !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'transactions must be an array' });
    }

    if (type !== undefined) {
      const isAllowedType = await isAccountTypeAllowed(type);
      if (!isAllowedType) {
        return res.status(400).json({ error: `Account type "${type}" is not supported` });
      }
      account.type = type;
    }

    if (accountName !== undefined) account.accountName = accountName;
    if (transactions !== undefined) account.transactions = transactions;
    if (currentBalance !== undefined) account.currentBalance = currentBalance;
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
    res.status(500).json({ error: 'Failed to update account', details: error.message });
  }
});

// Delete account
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await Account.findByIdAndDelete(account._id);
    await User.findByIdAndUpdate(req.session.userId, {
      $pull: { accounts: account._id },
    });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account', details: error.message });
  }
});

export default router;
