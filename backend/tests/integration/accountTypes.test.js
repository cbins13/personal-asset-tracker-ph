import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import AccountType from '../../models/AccountType.js';
import { createTestUser } from '../helpers/auth.js';

describe('Account Type Endpoints', () => {
  let user;

  beforeEach(async () => {
    user = await createTestUser({ email: 'accounttype@example.com' });
    
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

  describe('GET /api/account-types', () => {
    it('should return all account types', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/account-types');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accountTypes');
      expect(Array.isArray(response.body.accountTypes)).toBe(true);
    });

    it('should return account types with id field (not _id)', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/account-types');

      expect(response.status).toBe(200);
      if (response.body.accountTypes.length > 0) {
        expect(response.body.accountTypes[0]).toHaveProperty('id');
        expect(response.body.accountTypes[0]).not.toHaveProperty('_id');
      }
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/account-types');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/account-types/:id', () => {
    it('should return account type by ID', async () => {
      const walletType = AccountType.discriminators?.Wallet;
      if (walletType) {
        const accountType = await walletType.findOne({ type: 'Wallet' });
        if (accountType) {
          const agent = await getAuthenticatedAgent();
          const response = await agent.get(`/api/account-types/${accountType._id}`);

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('success', true);
          expect(response.body).toHaveProperty('accountType');
          expect(response.body.accountType.id).toBe(accountType._id.toString());
        }
      }
    });

    it('should return error for invalid ObjectId format', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/account-types/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return error for account type not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const agent = await getAuthenticatedAgent();
      const response = await agent.get(`/api/account-types/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('Account type not found');
    });
  });
});
