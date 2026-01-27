import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import Account from '../../models/Account.js';
import Transaction from '../../models/Transaction.js';
import { createTestUser } from '../helpers/auth.js';
import { createAccountFactory } from '../helpers/factories.js';

describe('Transaction Endpoints', () => {
  let user;
  let account1;
  let account2;

  beforeEach(async () => {
    user = await createTestUser({ email: 'txuser@example.com' });
    account1 = await createAccountFactory(user._id, { accountName: 'Account 1', currentBalance: 1000 });
    account2 = await createAccountFactory(user._id, { accountName: 'Account 2', currentBalance: 500 });
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

  describe('GET /api/transactions', () => {
    it('should return all transactions for user', async () => {
      await new Transaction({
        userId: user._id,
        accountId: account1._id,
        amount: 100,
        transactionKind: 'expense',
        type: 'debit',
        label: 'Test Expense',
      }).save();

      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/transactions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transactions');
      expect(Array.isArray(response.body.transactions)).toBe(true);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0]).toHaveProperty('id');
      expect(response.body.transactions[0].label).toBe('Test Expense');
    });

    it('should filter transactions by accountId', async () => {
      await new Transaction({
        userId: user._id,
        accountId: account1._id,
        amount: 100,
        transactionKind: 'expense',
        type: 'debit',
        label: 'Account 1 Transaction',
      }).save();

      await new Transaction({
        userId: user._id,
        accountId: account2._id,
        amount: 50,
        transactionKind: 'expense',
        type: 'debit',
        label: 'Account 2 Transaction',
      }).save();

      const agent = await getAuthenticatedAgent();
      const response = await agent.get(`/api/transactions?accountId=${account1._id}`);

      expect(response.status).toBe(200);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].label).toBe('Account 1 Transaction');
    });

    it('should filter transactions by kind', async () => {
      await new Transaction({
        userId: user._id,
        accountId: account1._id,
        amount: 100,
        transactionKind: 'income',
        type: 'credit',
        label: 'Income',
      }).save();

      await new Transaction({
        userId: user._id,
        accountId: account1._id,
        amount: 50,
        transactionKind: 'expense',
        type: 'debit',
        label: 'Expense',
      }).save();

      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/transactions?kind=income');

      expect(response.status).toBe(200);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].transactionKind).toBe('income');
    });

    it('should include account details when requested', async () => {
      await new Transaction({
        userId: user._id,
        accountId: account1._id,
        amount: 100,
        transactionKind: 'expense',
        type: 'debit',
        label: 'Test',
      }).save();

      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/transactions?includeAccounts=true');

      expect(response.status).toBe(200);
      expect(response.body.transactions[0]).toHaveProperty('account');
      expect(response.body.transactions[0].account).toHaveProperty('accountName');
    });
  });

  describe('POST /api/transactions', () => {
    it('should create income transaction and update account balance', async () => {
      const initialBalance = account1.currentBalance;
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/transactions')
        .send({
          accountId: account1._id.toString(),
          amount: 200,
          transactionKind: 'income',
          label: 'Salary',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.transaction.transactionKind).toBe('income');
      expect(response.body.transaction.amount).toBe(200);

      // Verify account balance updated
      const updatedAccount = await Account.findById(account1._id);
      expect(updatedAccount.currentBalance).toBe(initialBalance + 200);
    });

    it('should create expense transaction and update account balance', async () => {
      const initialBalance = account1.currentBalance;
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/transactions')
        .send({
          accountId: account1._id.toString(),
          amount: 150,
          transactionKind: 'expense',
          label: 'Groceries',
        });

      expect(response.status).toBe(201);
      expect(response.body.transaction.transactionKind).toBe('expense');

      // Verify account balance updated (decreased)
      const updatedAccount = await Account.findById(account1._id);
      expect(updatedAccount.currentBalance).toBe(initialBalance - 150);
    });

    it('should create transfer transaction and update both account balances', async () => {
      const initialBalance1 = account1.currentBalance;
      const initialBalance2 = account2.currentBalance;
      const transferAmount = 300;

      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/transactions')
        .send({
          fromAccountId: account1._id.toString(),
          toAccountId: account2._id.toString(),
          amount: transferAmount,
          transactionKind: 'transfer',
          label: 'Transfer',
        });

      expect(response.status).toBe(201);
      expect(response.body.transaction.transactionKind).toBe('transfer');
      expect(response.body.transaction.fromAccountId).toBe(account1._id.toString());
      expect(response.body.transaction.toAccountId).toBe(account2._id.toString());

      // Verify both account balances updated
      const updatedAccount1 = await Account.findById(account1._id);
      const updatedAccount2 = await Account.findById(account2._id);
      expect(updatedAccount1.currentBalance).toBe(initialBalance1 - transferAmount);
      expect(updatedAccount2.currentBalance).toBe(initialBalance2 + transferAmount);
    });

    it('should return error for transfer with same from/to account', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/transactions')
        .send({
          fromAccountId: account1._id.toString(),
          toAccountId: account1._id.toString(),
          amount: 100,
          transactionKind: 'transfer',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('must be different');
    });

    it('should return error for invalid amount', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/transactions')
        .send({
          accountId: account1._id.toString(),
          amount: -100,
          transactionKind: 'expense',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('amount');
    });

    it('should return error for missing accountId', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/transactions')
        .send({
          amount: 100,
          transactionKind: 'expense',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('accountId');
    });

    it('should return error for invalid accountId format', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/transactions')
        .send({
          accountId: 'invalid-id',
          amount: 100,
          transactionKind: 'expense',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('should update transaction amount and adjust account balance', async () => {
      const tx = await new Transaction({
        userId: user._id,
        accountId: account1._id,
        amount: 100,
        transactionKind: 'expense',
        type: 'debit',
        label: 'Original',
      }).save();

      // Update account balance manually to match
      account1.currentBalance = account1.currentBalance - 100;
      await account1.save();

      const initialBalance = account1.currentBalance;
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .put(`/api/transactions/${tx._id}`)
        .send({
          amount: 200,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transaction.amount).toBe(200);

      // Verify balance adjusted: revert -100, apply -200 = net -100
      const updatedAccount = await Account.findById(account1._id);
      expect(updatedAccount.currentBalance).toBe(initialBalance - 100);
    });

    it('should update transaction kind and adjust account balance', async () => {
      const tx = await new Transaction({
        userId: user._id,
        accountId: account1._id,
        amount: 100,
        transactionKind: 'expense',
        type: 'debit',
        label: 'Original',
      }).save();

      account1.currentBalance = account1.currentBalance - 100;
      await account1.save();

      const initialBalance = account1.currentBalance;
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .put(`/api/transactions/${tx._id}`)
        .send({
          transactionKind: 'income',
        });

      expect(response.status).toBe(200);
      expect(response.body.transaction.transactionKind).toBe('income');

      // Verify balance adjusted: revert -100, apply +100 = net +200
      const updatedAccount = await Account.findById(account1._id);
      expect(updatedAccount.currentBalance).toBe(initialBalance + 200);
    });

    it('should return error for invalid transaction ID format', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .put('/api/transactions/invalid-id')
        .send({ amount: 200 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return error for transaction not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .put(`/api/transactions/${fakeId}`)
        .send({ amount: 200 });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete expense transaction and revert account balance', async () => {
      const tx = await new Transaction({
        userId: user._id,
        accountId: account1._id,
        amount: 100,
        transactionKind: 'expense',
        type: 'debit',
        label: 'To Delete',
      }).save();

      account1.currentBalance = account1.currentBalance - 100;
      await account1.save();

      const initialBalance = account1.currentBalance;
      const agent = await getAuthenticatedAgent();
      const response = await agent.delete(`/api/transactions/${tx._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);

      // Verify transaction deleted
      const deletedTx = await Transaction.findById(tx._id);
      expect(deletedTx).toBeNull();

      // Verify balance reverted
      const updatedAccount = await Account.findById(account1._id);
      expect(updatedAccount.currentBalance).toBe(initialBalance + 100);
    });

    it('should delete transfer transaction and revert both account balances', async () => {
      const tx = await new Transaction({
        userId: user._id,
        fromAccountId: account1._id,
        toAccountId: account2._id,
        amount: 200,
        transactionKind: 'transfer',
        label: 'Transfer to Delete',
      }).save();

      account1.currentBalance = account1.currentBalance - 200;
      account2.currentBalance = account2.currentBalance + 200;
      await account1.save();
      await account2.save();

      const initialBalance1 = account1.currentBalance;
      const initialBalance2 = account2.currentBalance;

      const agent = await getAuthenticatedAgent();
      const response = await agent.delete(`/api/transactions/${tx._id}`);

      expect(response.status).toBe(200);

      // Verify balances reverted
      const updatedAccount1 = await Account.findById(account1._id);
      const updatedAccount2 = await Account.findById(account2._id);
      expect(updatedAccount1.currentBalance).toBe(initialBalance1 + 200);
      expect(updatedAccount2.currentBalance).toBe(initialBalance2 - 200);
    });

    it('should return error for invalid transaction ID format', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.delete('/api/transactions/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});
