import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import User from '../../models/User.js';
import Role from '../../models/Role.js';
import Permission from '../../models/Permission.js';
import { createTestUser, createTestAdmin } from '../helpers/auth.js';

describe('User Endpoints', () => {
  let user;
  let admin;

  beforeEach(async () => {
    user = await createTestUser({ email: 'regular@example.com' });
    admin = await createTestAdmin({ email: 'admin@example.com' });
  });

  const getAuthenticatedAgent = async (userEmail, password = 'password123') => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({
        email: userEmail,
        password,
      });
    return agent;
  };

  describe('GET /api/users (admin only)', () => {
    it('should return all users for admin', async () => {
      const agent = await getAuthenticatedAgent(admin.email);
      const response = await agent.get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should return error for non-admin user', async () => {
      const agent = await getAuthenticatedAgent(user.email);
      const response = await agent.get('/api/users');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Admin role required');
    });

    it('should include permission details when requested', async () => {
      const agent = await getAuthenticatedAgent(admin.email);
      const response = await agent.get('/api/users?includePermissionDetails=true');

      expect(response.status).toBe(200);
      expect(response.body.users[0]).toHaveProperty('permissions');
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return current user profile', async () => {
      const agent = await getAuthenticatedAgent(user.email);
      const response = await agent.get('/api/users/profile');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(user._id.toString());
      expect(response.body.user.email).toBe(user.email);
    });

    it('should include permission details when requested', async () => {
      const agent = await getAuthenticatedAgent(user.email);
      const response = await agent.get('/api/users/profile?includePermissionDetails=true');

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('permissions');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user name', async () => {
      const agent = await getAuthenticatedAgent(user.email);
      const response = await agent
        .put('/api/users/profile')
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe('Updated Name');
    });

    it('should update user preferences', async () => {
      const agent = await getAuthenticatedAgent(user.email);
      const response = await agent
        .put('/api/users/profile')
        .send({
          preferences: {
            theme: 'dark',
            currency: 'PHP',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.user.preferences).toHaveProperty('theme', 'dark');
      expect(response.body.user.preferences).toHaveProperty('currency', 'PHP');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ name: 'Test' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/users/:id (admin only)', () => {
    it('should update user roles', async () => {
      // Ensure role exists
      let testRole = await Role.findOne({ name: 'user' });
      if (!testRole) {
        testRole = new Role({
          name: 'user',
          displayName: 'User',
          description: 'Regular user',
          permissions: [],
          isActive: true,
        });
        await testRole.save();
      }

      const agent = await getAuthenticatedAgent(admin.email);
      const response = await agent
        .put(`/api/users/${user._id}`)
        .send({
          roles: ['user'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.roles).toContain('user');
    });

    it('should prevent removing last admin', async () => {
      // Create another admin first
      const admin2 = await createTestAdmin({ email: 'admin2@example.com' });

      // Try to remove admin role from admin2 (should work since admin still exists)
      const agent = await getAuthenticatedAgent(admin.email);
      const response = await agent
        .put(`/api/users/${admin2._id}`)
        .send({
          roles: ['user'],
        });

      expect(response.status).toBe(200);

      // Now try to remove admin role from the last admin (should fail)
      const response2 = await agent
        .put(`/api/users/${admin._id}`)
        .send({
          roles: ['user'],
        });

      expect(response2.status).toBe(400);
      expect(response2.body.error).toContain('Cannot remove your own admin role');
    });

    it('should return error for invalid ObjectId format', async () => {
      const agent = await getAuthenticatedAgent(admin.email);
      const response = await agent
        .put('/api/users/invalid-id')
        .send({ roles: ['user'] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return error for non-admin user', async () => {
      const agent = await getAuthenticatedAgent(user.email);
      const response = await agent
        .put(`/api/users/${user._id}`)
        .send({ roles: ['user'] });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/users/:id/permissions (admin only)', () => {
    it('should return user permissions with details', async () => {
      const agent = await getAuthenticatedAgent(admin.email);
      const response = await agent.get(`/api/users/${user._id}/permissions`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('permissions');
      expect(Array.isArray(response.body.permissions)).toBe(true);
    });

    it('should return error for invalid ObjectId format', async () => {
      const agent = await getAuthenticatedAgent(admin.email);
      const response = await agent.get('/api/users/invalid-id/permissions');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return error for non-admin user', async () => {
      const agent = await getAuthenticatedAgent(user.email);
      const response = await agent.get(`/api/users/${user._id}/permissions`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});
