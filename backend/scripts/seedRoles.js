import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../models/Role.js';
import connectDB from '../config/database.js';

dotenv.config();

const systemRoles = [
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: ['admin:all'],
    isActive: true,
    isSystemRole: true,
  },
  {
    name: 'user',
    displayName: 'User',
    description: 'Standard user with basic permissions',
    permissions: [],
    isActive: true,
    isSystemRole: true,
  },
  {
    name: 'moderator',
    displayName: 'Moderator',
    description: 'Moderator with elevated permissions',
    permissions: [],
    isActive: true,
    isSystemRole: true,
  },
];

async function seedRoles() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    for (const roleData of systemRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (existingRole) {
        console.log(`Role "${roleData.name}" already exists, skipping...`);
        continue;
      }

      const role = new Role(roleData);
      await role.save();
      console.log(`✓ Created role: ${roleData.displayName} (${roleData.name})`);
    }

    console.log('\nRole seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
}

seedRoles();
