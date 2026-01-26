import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import Account from '../../models/Account.js';
import Transaction from '../../models/Transaction.js';
import AccountType from '../../models/AccountType.js';
import CustomProvider from '../../models/CustomProvider.js';
import User from '../../models/User.js';
import { createTestUser } from '../helpers/auth.js';
import { createAccountFactory } from '../helpers/factories.js';

describe('Account Endpoints', () => {
  let user;

  beforeEach(async () => {
    // Create test user and login to get session
    user = await createTestUser({ email: 'accountuser@example.com' });
    
    // Ensure account types exist - create a Savings type for testing
    const savingsType = AccountType.discriminators?.Savings;
    if (savingsType) {
      const existing = await savingsType.findOne({ type: 'Savings' });
      if (!existing) {
        await new savingsType({
          type: 'Savings',
          accountName: 'Savings',
          interestRate: 0,
          goalAmount: 0,
          currentBalance: 0,
        }).save();
      }
    }
    
    const walletType = AccountType.discriminators?.Wallet;
    if (walletType) {
      const existing = await walletType.findOne({ type: 'Wallet' });
      if (!existing) {
        await new walletType({
          type: 'Wallet',
          walletName: 'Wallet',
          currentBalance: 0,
        }).save();
      }
    }
    
    const creditType = AccountType.discriminators?.Credit;
    if (creditType) {
      const existing = await creditType.findOne({ type: 'Credit' });
      if (!existing) {
        await new creditType({
          type: 'Credit',
          accountName: 'Credit',
          currentBalance: 0,
        }).save();
      }
    }

    const customOtherType = AccountType.discriminators?.['Custom - Other'];
    if (customOtherType) {
      const existing = await customOtherType.findOne({ type: 'Custom - Other' });
      if (!existing) {
        await new customOtherType({
          type: 'Custom - Other',
          accountName: 'Custom - Other',
          currentBalance: 0,
        }).save();
      }
    }
  });

  const getAuthenticatedAgent = async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: 'password123',
      });
    return agent;
  };

  describe('GET /api/accounts', () => {
    it('should return empty array for new user', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/accounts');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accounts');
      expect(Array.isArray(response.body.accounts)).toBe(true);
      expect(response.body.accounts.length).toBe(0);
    });

    it('should return user accounts only', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      await createAccountFactory(user._id, { accountName: 'My Account' });
      await createAccountFactory(otherUser._id, { accountName: 'Other Account' });

      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/accounts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accounts.length).toBe(1);
      expect(response.body.accounts[0].accountName).toBe('My Account');
      expect(response.body.accounts[0]).toHaveProperty('id');
      expect(response.body.accounts[0]).not.toHaveProperty('_id');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/accounts');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/accounts', () => {
    it('should create account with zero balance', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/accounts')
        .send({
          accountName: 'New Wallet',
          type: 'Wallet',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('account');
      expect(response.body.account.accountName).toBe('New Wallet');
      expect(response.body.account.currentBalance).toBe(0);
      expect(response.body.account).toHaveProperty('id');

      // Verify no transaction was created
      const transactions = await Transaction.find({ accountId: response.body.account.id });
      expect(transactions.length).toBe(0);
    });

    it('should create account with positive initial balance and transaction', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/accounts')
        .send({
          accountName: 'Savings Account',
          type: 'Savings',
          currentBalance: 1000,
          addToNetWorth: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.account.currentBalance).toBe(1000);

      // Verify transaction was created
      const transactions = await Transaction.find({ accountId: response.body.account.id });
      expect(transactions.length).toBe(1);
      expect(transactions[0].transactionKind).toBe('income');
      expect(transactions[0].amount).toBe(1000);
      expect(transactions[0].label).toBe('Initial balance');
    });

    it('should create account with negative initial balance and transaction', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/accounts')
        .send({
          accountName: 'Credit Card',
          type: 'Credit',
          currentBalance: -500,
        });

      expect(response.status).toBe(201);
      expect(response.body.account.currentBalance).toBe(-500);

      // Verify transaction was created
      const transactions = await Transaction.find({ accountId: response.body.account.id });
      expect(transactions.length).toBe(1);
      expect(transactions[0].transactionKind).toBe('expense');
      expect(transactions[0].amount).toBe(500);
    });

    it('should return error for missing required fields', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/accounts')
        .send({
          accountName: 'Incomplete Account',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('required');
    });

    it('should return error for invalid account type', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/accounts')
        .send({
          accountName: 'Invalid Type',
          type: 'InvalidType',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('not supported');
    });

    it('should create a custom account with Custom - Other type', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/accounts')
        .send({
          accountName: 'My Custom Account',
          type: 'Custom - Other',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.account.accountName).toBe('My Custom Account');
      expect(response.body.account.type).toBe('Custom - Other');
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should return account by ID', async () => {
      const account = await createAccountFactory(user._id, { accountName: 'Test Account' });
      const agent = await getAuthenticatedAgent();
      const response = await agent.get(`/api/accounts/${account._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.account.id).toBe(account._id.toString());
      expect(response.body.account.accountName).toBe('Test Account');
    });

    it('should return error for invalid ObjectId format', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/accounts/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Invalid account ID format');
    });

    it('should return error for account not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const agent = await getAuthenticatedAgent();
      const response = await agent.get(`/api/accounts/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('Account not found');
    });

    it('should prevent access to other user account', async () => {
      const otherUser = await createTestUser({ email: 'other2@example.com' });
      const otherAccount = await createAccountFactory(otherUser._id);

      const agent = await getAuthenticatedAgent();
      const response = await agent.get(`/api/accounts/${otherAccount._id}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/accounts/:id', () => {
    it('should update account name', async () => {
      const account = await createAccountFactory(user._id, { accountName: 'Old Name' });
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .put(`/api/accounts/${account._id}`)
        .send({
          accountName: 'New Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.account.accountName).toBe('New Name');
    });

    it('should prevent updating currentBalance directly', async () => {
      const account = await createAccountFactory(user._id, { currentBalance: 100 });
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .put(`/api/accounts/${account._id}`)
        .send({
          currentBalance: 500,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Cannot update currentBalance directly');
    });

    it('should return error for invalid ObjectId format', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .put('/api/accounts/invalid-id')
        .send({ accountName: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should delete account without transactions', async () => {
      const account = await createAccountFactory(user._id);
      const agent = await getAuthenticatedAgent();
      const response = await agent.delete(`/api/accounts/${account._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toBe('Account deleted successfully');

      // Verify account is deleted
      const deletedAccount = await Account.findById(account._id);
      expect(deletedAccount).toBeNull();

      // Verify user.accounts array is updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.accounts).not.toContain(account._id);
    });

    it('should prevent deletion of account with transactions', async () => {
      const account = await createAccountFactory(user._id);
      await new Transaction({
        userId: user._id,
        accountId: account._id,
        amount: 100,
        transactionKind: 'income',
        type: 'credit',
        label: 'Test Transaction',
      }).save();

      const agent = await getAuthenticatedAgent();
      const response = await agent.delete(`/api/accounts/${account._id}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Cannot delete account with existing transactions');
      expect(response.body.details).toContain('transaction');

      // Verify account still exists
      const existingAccount = await Account.findById(account._id);
      expect(existingAccount).not.toBeNull();
    });

    it('should return error for invalid ObjectId format', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.delete('/api/accounts/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/accounts/providers', () => {
    it('should return providers by type', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/accounts/providers');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('providersByType');
      expect(response.body.providersByType).toHaveProperty('Wallet');
      expect(response.body.providersByType).toHaveProperty('Savings');
    });

    it('should return only user-specific providers for the current user', async () => {
      const otherUser = await createTestUser({ email: 'providerother@example.com' });
      await CustomProvider.create({
        userId: user._id,
        type: 'Wallet',
        providerId: 'custom-wallet',
        providerLabel: 'My Custom Wallet',
        accent: 'bg-gray-500',
      });
      await CustomProvider.create({
        userId: otherUser._id,
        type: 'Wallet',
        providerId: 'other-wallet',
        providerLabel: 'Other Custom Wallet',
        accent: 'bg-gray-500',
      });

      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/accounts/providers');

      expect(response.status).toBe(200);
      const walletProviders = response.body.providersByType.Wallet || [];
      const providerLabels = walletProviders.map((provider) => provider.label);
      expect(providerLabels).toContain('My Custom Wallet');
      expect(providerLabels).not.toContain('Other Custom Wallet');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/accounts/providers');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/accounts/providers', () => {
    it('should create a custom provider with Custom type', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/accounts/providers')
        .send({
          type: 'Custom',
          providerLabel: 'My Custom Account',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.provider.label).toBe('My Custom Account');

      const stored = await CustomProvider.findOne({
        userId: user._id,
        providerLabel: 'My Custom Account',
        type: 'Custom',
      });
      expect(stored).not.toBeNull();
    });

    it('should normalize Wallet type to Custom for custom providers', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/accounts/providers')
        .send({
          type: 'Wallet',
          providerLabel: 'Wallet Custom',
        });

      expect(response.status).toBe(201);
      const stored = await CustomProvider.findOne({
        userId: user._id,
        providerLabel: 'Wallet Custom',
        type: 'Custom',
      });
      expect(stored).not.toBeNull();
    });
  });
});
