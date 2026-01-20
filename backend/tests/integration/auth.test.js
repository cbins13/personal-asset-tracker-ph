import request from 'supertest';
import app from '../../app.js';
import User from '../../models/User.js';
import { createTestUser } from '../helpers/auth.js';

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.name).toBe('New User');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return error for duplicate email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Duplicate User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'User already exists');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Email, password, and name are required');
    });

    it('should return error for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weakpass@example.com',
          password: '123', // Too short
          name: 'Weak Password User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.toLowerCase()).toContain('password');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const user = await createTestUser({
        email: 'login@example.com',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(user._id.toString());
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      await createTestUser({
        email: 'valid@example.com',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'valid@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return error for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'incomplete@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const user = await createTestUser();
      const agent = request.agent(app);
      
      // First login to create session
      await agent
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'password123',
        });

      const response = await agent.post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const user = await createTestUser({
        email: 'me@example.com',
        name: 'Me User',
      });

      const agent = request.agent(app);
      
      // Simulate session by manually setting cookie
      // In real scenario, this would be set by login
      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'password123',
        });

      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(user._id.toString());
      expect(response.body.user.email).toBe('me@example.com');
    });

    it('should return error when not authenticated', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });
  });
});
