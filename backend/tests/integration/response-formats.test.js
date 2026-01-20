import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import AccountType from '../../models/AccountType.js';
import { createTestUser } from '../helpers/auth.js';
import { createAccountFactory } from '../helpers/factories.js';

describe('Response Format Consistency', () => {
  let user;

  beforeEach(async () => {
    user = await createTestUser({ email: 'format@example.com' });
    
    // Ensure account types exist
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

  describe('Success Response Format', () => {
    it('should include success: true in all success responses', async () => {
      const agent = await getAuthenticatedAgent();
      
      // Test GET /api/accounts
      const getResponse = await agent.get('/api/accounts');
      expect(getResponse.body).toHaveProperty('success', true);

      // Test POST /api/accounts
      const postResponse = await agent
        .post('/api/accounts')
        .send({
          accountName: 'Test Account',
          type: 'Wallet',
        });
      expect(postResponse.body).toHaveProperty('success', true);

      // Test GET /api/transactions
      const txResponse = await agent.get('/api/transactions');
      expect(txResponse.body).toHaveProperty('success', true);
    });

    it('should convert _id to id in all responses', async () => {
      const agent = await getAuthenticatedAgent();
      const account = await createAccountFactory(user._id);

      const response = await agent.get(`/api/accounts/${account._id}`);
      expect(response.body.account).toHaveProperty('id');
      expect(response.body.account).not.toHaveProperty('_id');
      expect(response.body.account.id).toBe(account._id.toString());
    });
  });

  describe('Error Response Format', () => {
    it('should include success: false in all error responses', async () => {
      // Test 400 error
      const badRequest = await request(app)
        .post('/api/accounts')
        .send({ accountName: 'Test' }); // Missing type
      expect(badRequest.body).toHaveProperty('success', false);
      expect(badRequest.body).toHaveProperty('error');

      // Test 401 error
      const unauthorized = await request(app).get('/api/accounts');
      expect(unauthorized.body).toHaveProperty('success', false);
      expect(unauthorized.body).toHaveProperty('error');

      // Test 404 error
      const agent = await getAuthenticatedAgent();
      const fakeId = new mongoose.Types.ObjectId();
      const notFound = await agent.get(`/api/accounts/${fakeId}`);
      expect(notFound.body).toHaveProperty('success', false);
      expect(notFound.body).toHaveProperty('error');
    });

    it('should include details field in error responses when available', async () => {
      const agent = await getAuthenticatedAgent();
      const account = await createAccountFactory(user._id);
      
      // Create a transaction so deletion fails
      await new (await import('../../models/Transaction.js')).default({
        userId: user._id,
        accountId: account._id,
        amount: 100,
        transactionKind: 'income',
        type: 'credit',
        label: 'Test',
      }).save();

      const response = await agent.delete(`/api/accounts/${account._id}`);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });
  });

  describe('HTTP Status Codes', () => {
    it('should return 200 for successful GET requests', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/accounts');
      expect(response.status).toBe(200);
    });

    it('should return 201 for successful POST requests', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/accounts')
        .send({
          accountName: 'New Account',
          type: 'Wallet',
        });
      expect(response.status).toBe(201);
    });

    it('should return 400 for bad requests', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent
        .post('/api/accounts')
        .send({
          accountName: 'Invalid',
          // Missing type
        });
      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/api/accounts');
      expect(response.status).toBe(401);
    });

    it('should return 403 for forbidden requests', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/users');
      expect(response.status).toBe(403);
    });

    it('should return 404 for not found resources', async () => {
      const agent = await getAuthenticatedAgent();
      const fakeId = new mongoose.Types.ObjectId();
      const response = await agent.get(`/api/accounts/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });
});
