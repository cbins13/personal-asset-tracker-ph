import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { createTestUser } from '../helpers/auth.js';
import { createAccountFactory } from '../helpers/factories.js';

describe('Input Validation Tests', () => {
  let user;

  beforeEach(async () => {
    user = await createTestUser({ email: 'validation@example.com' });
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

  describe('ObjectId Format Validation', () => {
    it('should reject invalid ObjectId format in account routes', async () => {
      const agent = await getAuthenticatedAgent();
      
      const getResponse = await agent.get('/api/accounts/invalid-id');
      expect(getResponse.status).toBe(400);
      expect(getResponse.body.error).toContain('Invalid account ID format');

      const putResponse = await agent
        .put('/api/accounts/invalid-id')
        .send({ accountName: 'Test' });
      expect(putResponse.status).toBe(400);

      const deleteResponse = await agent.delete('/api/accounts/invalid-id');
      expect(deleteResponse.status).toBe(400);
    });

    it('should reject invalid ObjectId format in transaction routes', async () => {
      const agent = await getAuthenticatedAgent();
      
      const getResponse = await agent.get('/api/transactions/invalid-id');
      // Note: GET by ID might not exist, but if it does, should validate
      
      const putResponse = await agent
        .put('/api/transactions/invalid-id')
        .send({ amount: 100 });
      expect(putResponse.status).toBe(400);
      expect(putResponse.body.error).toContain('Invalid transaction ID format');

      const deleteResponse = await agent.delete('/api/transactions/invalid-id');
      expect(deleteResponse.status).toBe(400);
    });

    it('should reject invalid ObjectId format in user routes', async () => {
      const admin = await (await import('../helpers/auth.js')).createTestAdmin();
      const agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({
          email: admin.email,
          password: 'password123',
        });

      const response = await agent
        .put('/api/users/invalid-id')
        .send({ roles: ['user'] });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid user ID format');
    });
  });

  describe('Required Field Validation', () => {
    it('should require accountName and type for account creation', async () => {
      const agent = await getAuthenticatedAgent();
      
      const response1 = await agent
        .post('/api/accounts')
        .send({ accountName: 'Test' });
      expect(response1.status).toBe(400);
      expect(response1.body.error).toContain('required');

      const response2 = await agent
        .post('/api/accounts')
        .send({ type: 'Wallet' });
      expect(response2.status).toBe(400);
      expect(response2.body.error).toContain('required');
    });

    it('should require accountId for transaction creation', async () => {
      const agent = await getAuthenticatedAgent();
      
      const response = await agent
        .post('/api/transactions')
        .send({
          amount: 100,
          transactionKind: 'expense',
        });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('accountId');
    });

    it('should require email, password, and name for registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('Type Validation', () => {
    it('should validate account type enum', async () => {
      const agent = await getAuthenticatedAgent();
      
      const response = await agent
        .post('/api/accounts')
        .send({
          accountName: 'Test',
          type: 'InvalidType',
        });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not supported');
    });

    it('should validate transaction kind enum', async () => {
      const agent = await getAuthenticatedAgent();
      const account = await createAccountFactory(user._id);
      
      const response = await agent
        .post('/api/transactions')
        .send({
          accountId: account._id.toString(),
          amount: 100,
          transactionKind: 'invalid-kind',
        });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('transactionKind is invalid');
    });

    it('should validate amount is positive number', async () => {
      const agent = await getAuthenticatedAgent();
      const account = await createAccountFactory(user._id);
      
      const response1 = await agent
        .post('/api/transactions')
        .send({
          accountId: account._id.toString(),
          amount: -100,
          transactionKind: 'expense',
        });
      expect(response1.status).toBe(400);
      expect(response1.body.error).toContain('amount');

      const response2 = await agent
        .post('/api/transactions')
        .send({
          accountId: account._id.toString(),
          amount: 0,
          transactionKind: 'expense',
        });
      expect(response2.status).toBe(400);

      const response3 = await agent
        .post('/api/transactions')
        .send({
          accountId: account._id.toString(),
          amount: 'not-a-number',
          transactionKind: 'expense',
        });
      expect(response3.status).toBe(400);
    });

    it('should validate accountName is not empty', async () => {
      const agent = await getAuthenticatedAgent();
      const account = await createAccountFactory(user._id);
      
      const response = await agent
        .put(`/api/accounts/${account._id}`)
        .send({
          accountName: '   ',
        });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('cannot be empty');
    });

    it('should validate arrays are actually arrays', async () => {
      const agent = await getAuthenticatedAgent();
      
      const response = await agent
        .post('/api/accounts')
        .send({
          accountName: 'Test',
          type: 'Wallet',
          transactions: 'not-an-array',
        });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('must be an array');
    });
  });

  describe('Transfer Validation', () => {
    it('should require both fromAccountId and toAccountId for transfers', async () => {
      const agent = await getAuthenticatedAgent();
      
      const response = await agent
        .post('/api/transactions')
        .send({
          amount: 100,
          transactionKind: 'transfer',
        });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('fromAccountId and toAccountId');
    });

    it('should prevent transfer with same from/to account', async () => {
      const agent = await getAuthenticatedAgent();
      const account = await createAccountFactory(user._id);
      
      const response = await agent
        .post('/api/transactions')
        .send({
          fromAccountId: account._id.toString(),
          toAccountId: account._id.toString(),
          amount: 100,
          transactionKind: 'transfer',
        });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('must be different');
    });
  });
});
