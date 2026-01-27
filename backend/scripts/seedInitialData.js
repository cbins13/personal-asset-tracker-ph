import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import AccountType from '../models/AccountType.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Provider from '../models/Provider.js';
import connectDB from '../config/database.js';
import { hashPassword } from '../utils/password.js';

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

const accountTypesToCreate = [
  {
    type: 'Savings',
    data: {
      accountName: 'Savings',
      interestRate: 0,
      goalAmount: 0,
      currentBalance: 0,
    },
  },
  {
    type: 'Wallet',
    data: {
      walletName: 'Wallet',
      currentBalance: 0,
    },
  },
  {
    type: 'Investments',
    data: {
      investmentName: 'Investments',
      startingBalance: 0,
      interestRate: 0,
      startDate: new Date(),
      endDate: new Date(),
    },
  },
  {
    type: 'Credit',
    data: {
      accountName: 'Credit',
      currentBalance: 0,
    },
  },
  {
    type: 'Loans',
    data: {
      accountName: 'Loans',
      currentBalance: 0,
    },
  },
  {
    type: 'Custom - Other',
    data: {
      accountName: 'Custom - Other',
      currentBalance: 0,
    },
  },
];

const categoriesToCreate = [
  { label: 'Balance Adjustment', emoji: '🔄', type: 'expense' },
  { label: 'Family Support', emoji: '👨‍👩‍👧‍👦', type: 'expense' },
  { label: 'Food and Drinks', emoji: '🍔', type: 'expense' },
  { label: 'Gifts', emoji: '🎁', type: 'expense' },
  { label: 'Grocery', emoji: '🛒', type: 'expense' },
  { label: 'Insurance Payment', emoji: '☂️', type: 'expense' },
  { label: 'Medicine', emoji: '💊', type: 'expense' },
  { label: 'Night Out', emoji: '🍻', type: 'expense' },
  { label: 'Pet', emoji: '🐶', type: 'expense' },
  { label: 'Rent', emoji: '🏠', type: 'expense' },
  { label: 'Shopping', emoji: '🛍️', type: 'expense' },
  { label: 'Subscriptions', emoji: '🔔', type: 'expense' },
  { label: 'Transportation', emoji: '🚗', type: 'expense' },
  { label: 'Utilities', emoji: '💡', type: 'expense' },
];

const providersToCreate = [
  {
    type: 'Wallet',
    providers: [
      { providerId: 'cash', providerLabel: 'Cash on Hand', accent: 'bg-green-500' },
      { providerId: 'beep', providerLabel: 'Beep - Wallet', accent: 'bg-blue-900' },
      { providerId: 'gcash', providerLabel: 'GCash - Wallet', accent: 'bg-blue-500' },
      { providerId: 'gotyme', providerLabel: 'GoTyme - Wallet', accent: 'bg-cyan-500' },
      { providerId: 'grabpay', providerLabel: 'GrabPay - Wallet', accent: 'bg-emerald-500' },
      { providerId: 'joyride', providerLabel: 'JoyRide Pay - Wallet', accent: 'bg-indigo-600' },
      { providerId: 'lazada', providerLabel: 'Lazada - Wallet', accent: 'bg-pink-500' },
      { providerId: 'maya', providerLabel: 'Maya - Wallet', accent: 'bg-gray-900' },
    ],
  },
  {
    type: 'Savings',
    providers: [
      { providerId: 'bpi', providerLabel: 'BPI - Savings', accent: 'bg-red-500' },
      { providerId: 'bdo', providerLabel: 'BDO - Savings', accent: 'bg-blue-600' },
      { providerId: 'metrobank', providerLabel: 'Metrobank - Savings', accent: 'bg-indigo-700' },
      { providerId: 'unionbank', providerLabel: 'UnionBank - Savings', accent: 'bg-orange-500' },
    ],
  },
  {
    type: 'Credit',
    providers: [
      { providerId: 'citi', providerLabel: 'Citi - Credit', accent: 'bg-blue-700' },
      { providerId: 'bpi-credit', providerLabel: 'BPI - Credit', accent: 'bg-red-600' },
      { providerId: 'bdo-credit', providerLabel: 'BDO - Credit', accent: 'bg-blue-500' },
    ],
  },
  {
    type: 'Loans',
    providers: [
      { providerId: 'atome', providerLabel: 'Atome - Loan/Credit', accent: 'bg-lime-300' },
      { providerId: 'billease', providerLabel: 'Billease - Loan/Credit', accent: 'bg-blue-400' },
      { providerId: 'cashalo', providerLabel: 'Cashalo - Loan/Credit', accent: 'bg-yellow-400' },
      { providerId: 'cimb', providerLabel: 'CIMB - Loan/Credit', accent: 'bg-red-500' },
      { providerId: 'gcash-loan', providerLabel: 'GCash - Loan/Credit', accent: 'bg-blue-500' },
      { providerId: 'gotyme-loan', providerLabel: 'GoTyme - Loan/Credit', accent: 'bg-cyan-500' },
      { providerId: 'homecredit', providerLabel: 'Home Credit - Loan/Credit', accent: 'bg-red-400' },
    ],
  },
  {
    type: 'Investments',
    providers: [
      { providerId: 'mp2', providerLabel: 'MP2 - Investments', accent: 'bg-indigo-600' },
      { providerId: 'col', providerLabel: 'COL - Investments', accent: 'bg-gray-700' },
      { providerId: 'gcash-invest', providerLabel: 'GCash - Investments', accent: 'bg-blue-500' },
    ],
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

    // Step 3: Create account types
    console.log('\n=== Creating Account Types ===');
    const createdAccountTypes = [];
    for (const accountType of accountTypesToCreate) {
      const existing = await AccountType.findOne({ type: accountType.type });
      if (existing) {
        console.log(`  ⏭️  Account type "${accountType.type}" already exists, skipping...`);
        continue;
      }

      const AccountTypeModel = AccountType.discriminators?.[accountType.type];
      if (!AccountTypeModel) {
        console.log(`  ⚠️  Account type model "${accountType.type}" not found, skipping...`);
        continue;
      }

      const accountTypeDoc = new AccountTypeModel(accountType.data);
      await accountTypeDoc.save();
      createdAccountTypes.push(accountTypeDoc);
      console.log(`  ✓ Created account type: ${accountType.type}`);
    }

    // Step 4: Create categories
    console.log('\n=== Creating Categories ===');
    for (const categoryData of categoriesToCreate) {
      const existing = await Category.findOne({ label: categoryData.label });
      if (existing) {
        console.log(`  ⏭️  Category "${categoryData.label}" already exists, skipping...`);
        continue;
      }

      const category = new Category(categoryData);
      await category.save();
      console.log(`  ✓ Created category: ${categoryData.label}`);
    }

    // Step 5: Create providers catalog
    console.log('\n=== Creating Providers ===');
    const existingProviderCount = await Provider.countDocuments();
    if (existingProviderCount > 0) {
      console.log('  ⏭️  Providers already exist, skipping provider seeding...');
    } else {
      const providerDocs = providersToCreate.flatMap((group) =>
        group.providers.map((provider) => ({
          ...provider,
          type: group.type,
        }))
      );
      if (providerDocs.length > 0) {
        await Provider.insertMany(providerDocs);
        console.log(`  ✓ Created ${providerDocs.length} providers`);
      }
    }

    // Step 6: Create demo user + demo accounts (optional helper data)
    console.log('\n=== Creating Demo User & Accounts ===');
    const demoEmail = 'demo@savvi.local';
    const demoPassword = 'Demo123!';
    let demoUser = await User.findOne({ email: demoEmail });
    if (!demoUser) {
      const hashedPassword = await hashPassword(demoPassword);
      demoUser = new User({
        email: demoEmail,
        password: hashedPassword,
        name: 'Demo User',
        provider: 'local',
        roles: ['user'],
      });
      await demoUser.save();
      console.log(`  ✓ Created demo user (${demoEmail})`);
    } else {
      console.log(`  ⏭️  Demo user already exists (${demoEmail}), skipping user creation...`);
    }

    const existingDemoAccounts = await Account.countDocuments({ userId: demoUser._id });
    if (existingDemoAccounts > 0) {
      console.log('  ⏭️  Demo accounts already exist, skipping account seeding...');
    } else {
      const demoAccounts = [
        {
          accountName: 'Daily Wallet',
          type: 'Wallet',
          providerId: 'gcash',
          providerLabel: 'GCash - Wallet',
          addToNetWorth: true,
          transactions: [
            { amount: 5000, type: 'credit', label: 'Initial cash-in', occurredAt: new Date() },
            { amount: 1200, type: 'debit', label: 'Groceries', occurredAt: new Date() },
            { amount: 800, type: 'debit', label: 'Transport', occurredAt: new Date() },
          ],
        },
        {
          accountName: 'Emergency Fund',
          type: 'Savings',
          providerId: 'bpi',
          providerLabel: 'BPI - Savings',
          addToNetWorth: true,
          transactions: [
            { amount: 25000, type: 'credit', label: 'Initial deposit', occurredAt: new Date() },
            { amount: 1500, type: 'credit', label: 'Interest', occurredAt: new Date() },
          ],
        },
        {
          accountName: 'Rewards Credit',
          type: 'Credit',
          providerId: 'citi',
          providerLabel: 'Citi - Credit',
          addToNetWorth: false,
          transactions: [
            { amount: 3200, type: 'debit', label: 'Online purchase', occurredAt: new Date() },
            { amount: 1000, type: 'credit', label: 'Payment', occurredAt: new Date() },
          ],
        },
        {
          accountName: 'MP2 Fund',
          type: 'Investments',
          providerId: 'mp2',
          providerLabel: 'MP2 - Investments',
          addToNetWorth: true,
          transactions: [
            { amount: 10000, type: 'credit', label: 'Contribution', occurredAt: new Date() },
          ],
        },
        {
          accountName: 'Home Credit',
          type: 'Loans',
          providerId: 'homecredit',
          providerLabel: 'Home Credit - Loan/Credit',
          addToNetWorth: false,
          transactions: [
            { amount: 12000, type: 'credit', label: 'Loan disbursement', occurredAt: new Date() },
            { amount: 2000, type: 'debit', label: 'Monthly payment', occurredAt: new Date() },
          ],
        },
      ];

      const createdAccounts = [];
      const createdTransactions = [];

      for (const demoAccount of demoAccounts) {
        const balance = demoAccount.transactions.reduce((total, tx) => {
          const signed = tx.type === 'debit' ? -Math.abs(tx.amount) : Math.abs(tx.amount);
          return total + signed;
        }, 0);

        const accountDoc = new Account({
          userId: demoUser._id,
          accountName: demoAccount.accountName,
          type: demoAccount.type,
          providerId: demoAccount.providerId,
          providerLabel: demoAccount.providerLabel,
          addToNetWorth: demoAccount.addToNetWorth,
          currentBalance: balance,
        });

        await accountDoc.save();
        createdAccounts.push(accountDoc);

        for (const tx of demoAccount.transactions) {
          const txDoc = new Transaction({
            userId: demoUser._id,
            accountId: accountDoc._id,
            amount: tx.amount,
            type: tx.type,
            label: tx.label,
            occurredAt: tx.occurredAt,
          });
          await txDoc.save();
          createdTransactions.push(txDoc);
        }
      }

      await User.findByIdAndUpdate(demoUser._id, {
        $addToSet: { accounts: { $each: createdAccounts.map((acc) => acc._id) } },
      });

      console.log(`  ✓ Created ${createdAccounts.length} demo accounts`);
      console.log(`  ✓ Created ${createdTransactions.length} demo transactions`);
    }

    console.log('\n✅ Initial data seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Permissions: ${createdPermissions.length} created`);
    console.log(`  - Roles: ${rolesToCreate.length} system roles available`);
    console.log(`  - Account Types: ${createdAccountTypes.length} created`);
    console.log('\nYour user data is now synced with the Roles and Permissions collections.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding initial data:', error);
    process.exit(1);
  }
}

seedInitialData();
