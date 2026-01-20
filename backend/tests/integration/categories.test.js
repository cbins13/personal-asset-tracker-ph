import request from 'supertest';
import app from '../../app.js';
import Category from '../../models/Category.js';
import { createTestUser } from '../helpers/auth.js';

describe('Category Endpoints', () => {
  let user;

  beforeEach(async () => {
    user = await createTestUser({ email: 'category@example.com' });
    
    // Create test categories
    await new Category({
      label: 'Food',
      emoji: '🍔',
      type: 'expense',
      isActive: true,
    }).save();

    await new Category({
      label: 'Transport',
      emoji: '🚗',
      type: 'expense',
      isActive: true,
    }).save();

    await new Category({
      label: 'Inactive Category',
      emoji: '❌',
      type: 'expense',
      isActive: false,
    }).save();
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

  describe('GET /api/categories', () => {
    it('should return only active categories', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBe(2);
      expect(response.body.categories.every(cat => cat.isActive === true)).toBe(true);
    });

    it('should return categories with id field (not _id)', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.categories[0]).toHaveProperty('id');
      expect(response.body.categories[0]).not.toHaveProperty('_id');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/categories');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return categories sorted by label', async () => {
      const agent = await getAuthenticatedAgent();
      const response = await agent.get('/api/categories');

      expect(response.status).toBe(200);
      const labels = response.body.categories.map(cat => cat.label);
      const sortedLabels = [...labels].sort();
      expect(labels).toEqual(sortedLabels);
    });
  });
});
