import User from '../../models/User.js';
import Role from '../../models/Role.js';
import { hashPassword } from '../../utils/password.js';

/**
 * Create a test user with optional role
 */
export const createTestUser = async (userData = {}) => {
  // Ensure user role exists
  let userRole = await Role.findOne({ name: 'user' });
  if (!userRole) {
    userRole = new Role({
      name: 'user',
      displayName: 'User',
      description: 'Standard user',
      permissions: [],
      isSystemRole: true,
      isActive: true,
    });
    await userRole.save();
  }

  const defaultData = {
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    password: await hashPassword('password123'),
    provider: 'local',
    roles: ['user'],
    isActive: true,
  };

  const user = new User({ ...defaultData, ...userData });
  await user.save();
  return user;
};

/**
 * Create a test admin user
 */
export const createTestAdmin = async (userData = {}) => {
  // Ensure admin role exists
  let adminRole = await Role.findOne({ name: 'admin' });
  if (!adminRole) {
    adminRole = new Role({
      name: 'admin',
      displayName: 'Administrator',
      description: 'System administrator',
      permissions: [],
      isSystemRole: true,
      isActive: true,
    });
    await adminRole.save();
  }

  const defaultData = {
    email: `admin${Date.now()}@example.com`,
    name: 'Admin User',
    password: await hashPassword('password123'),
    provider: 'local',
    roles: ['admin'],
    isActive: true,
  };

  const user = new User({ ...defaultData, ...userData });
  await user.save();
  return user;
};

/**
 * Create a session for a user (simulate login)
 */
export const createSession = (userId) => {
  return {
    userId: userId.toString(),
    userEmail: 'test@example.com',
    cookie: {
      originalMaxAge: 14 * 24 * 60 * 60 * 1000,
      expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      path: '/',
    },
  };
};

/**
 * Get authenticated request helper
 * This simulates a logged-in user by setting session
 */
export const getAuthenticatedRequest = (userId) => {
  return {
    session: createSession(userId),
  };
};
