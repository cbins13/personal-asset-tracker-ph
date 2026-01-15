import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import connectDB from '../config/database.js';

dotenv.config();

// Define permissions to create
const permissionsToCreate = [
  // User management permissions
  {
    name: 'users:read',
    description: 'Read user information',
    category: 'user_management',
  },
  {
    name: 'users:write',
    description: 'Create and update users',
    category: 'user_management',
  },
  {
    name: 'users:delete',
    description: 'Delete users',
    category: 'user_management',
  },
  
  // Asset management permissions (for future use)
  {
    name: 'assets:read',
    description: 'Read asset information',
    category: 'asset_management',
  },
  {
    name: 'assets:write',
    description: 'Create and update assets',
    category: 'asset_management',
  },
  {
    name: 'assets:delete',
    description: 'Delete assets',
    category: 'asset_management',
  },
  
  // Transactions permissions (example from user requirement)
  {
    name: 'transactions:read',
    description: 'Read transaction information',
    category: 'asset_management',
  },
  {
    name: 'transactions:write',
    description: 'Create and update transactions',
    category: 'asset_management',
  },
  {
    name: 'transactions:edit',
    description: 'Edit transactions',
    category: 'asset_management',
  },
  {
    name: 'transactions:delete',
    description: 'Delete transactions',
    category: 'asset_management',
  },
  
  // Admin permissions
  {
    name: 'admin:all',
    description: 'Full administrative access',
    category: 'admin',
  },
];

// Define roles with their permissions
const rolesToCreate = [
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: [
      'admin:all',
      'users:read',
      'users:write',
      'users:delete',
      'assets:read',
      'assets:write',
      'assets:delete',
      'transactions:read',
      'transactions:write',
      'transactions:edit',
      'transactions:delete',
    ],
    isActive: true,
    isSystemRole: true,
  },
  {
    name: 'user',
    displayName: 'User',
    description: 'Standard user with basic permissions',
    permissions: [
      'transactions:read',
      'transactions:write',
      'transactions:edit',
      'transactions:delete',
      'assets:read',
    ],
    isActive: true,
    isSystemRole: true,
  },
  {
    name: 'moderator',
    displayName: 'Moderator',
    description: 'Moderator with elevated permissions',
    permissions: [
      'users:read',
      'assets:read',
      'assets:write',
      'transactions:read',
      'transactions:write',
      'transactions:edit',
    ],
    isActive: true,
    isSystemRole: true,
  },
];

async function seedInitialData() {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    // Step 1: Create permissions
    console.log('=== Creating Permissions ===');
    const createdPermissions = [];
    for (const permData of permissionsToCreate) {
      const existing = await Permission.findOne({ name: permData.name });
      if (existing) {
        console.log(`  ⏭️  Permission "${permData.name}" already exists, skipping...`);
        createdPermissions.push(existing);
        continue;
      }

      const permission = new Permission(permData);
      await permission.save();
      console.log(`  ✓ Created permission: ${permData.name}`);
      createdPermissions.push(permission);
    }

    // Step 2: Create roles
    console.log('\n=== Creating Roles ===');
    for (const roleData of rolesToCreate) {
      const existing = await Role.findOne({ name: roleData.name });
      if (existing) {
        console.log(`  ⏭️  Role "${roleData.name}" already exists, skipping...`);
        continue;
      }

      // Verify all permissions exist
      const permissionDocs = await Permission.find({
        name: { $in: roleData.permissions },
      });
      const existingPermissionNames = permissionDocs.map((p) => p.name);
      const missingPermissions = roleData.permissions.filter(
        (p) => !existingPermissionNames.includes(p)
      );

      if (missingPermissions.length > 0) {
        console.log(
          `  ⚠️  Role "${roleData.name}" has missing permissions: ${missingPermissions.join(', ')}`
        );
        console.log(`  ⚠️  Skipping role creation...`);
        continue;
      }

      const role = new Role({
        ...roleData,
        permissions: roleData.permissions,
      });
      await role.save();
      console.log(
        `  ✓ Created role: ${roleData.displayName} (${roleData.name}) with ${roleData.permissions.length} permissions`
      );
    }

    console.log('\n✅ Initial data seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Permissions: ${createdPermissions.length} created`);
    console.log(`  - Roles: ${rolesToCreate.length} system roles available`);
    console.log('\nYour user data is now synced with the Roles and Permissions collections.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding initial data:', error);
    process.exit(1);
  }
}

seedInitialData();
