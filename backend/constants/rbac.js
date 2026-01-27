// Role-Based Access Control Constants

// Valid roles in the system
export const VALID_ROLES = ['admin', 'user', 'moderator'];

// Valid permissions in the system
// Format: resource:action (e.g., users:read, users:write)
export const VALID_PERMISSIONS = [
  // User management permissions
  'users:read',
  'users:write',
  'users:delete',
  
  // Asset management permissions (for future use)
  'assets:read',
  'assets:write',
  'assets:delete',
  
  // Admin permissions
  'admin:all',
];

// Default roles for new users
export const DEFAULT_ROLE = 'user';

// Permissions that are automatically granted with certain roles
export const ROLE_PERMISSIONS = {
  admin: ['admin:all', 'users:read', 'users:write', 'users:delete', 'assets:read', 'assets:write', 'assets:delete'],
  moderator: ['users:read', 'assets:read', 'assets:write'],
  user: ['assets:read'],
};
