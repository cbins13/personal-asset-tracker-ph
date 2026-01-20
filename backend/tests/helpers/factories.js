import Account from '../../models/Account.js';
import Transaction from '../../models/Transaction.js';
import Category from '../../models/Category.js';
import AccountType from '../../models/AccountType.js';

/**
 * Create a test account
 */
export const createAccountFactory = async (userId, accountData = {}) => {
  const defaultData = {
    userId,
    accountName: `Test Account ${Date.now()}`,
    type: 'Wallet',
    currentBalance: 0,
    addToNetWorth: true,
    transactions: [],
  };

  const account = new Account({ ...defaultData, ...accountData });
  await account.save();
  return account;
};

/**
 * Create a test transaction
 */
export const createTransactionFactory = async (userId, transactionData = {}) => {
  const defaultData = {
    userId,
    amount: 100,
    transactionKind: 'expense',
    type: 'debit',
    label: 'Test Transaction',
    occurredAt: new Date(),
    recordInBudget: false,
  };

  const transaction = new Transaction({ ...defaultData, ...transactionData });
  await transaction.save();
  return transaction;
};

/**
 * Create a test category
 */
export const createCategoryFactory = async (categoryData = {}) => {
  const defaultData = {
    label: `Test Category ${Date.now()}`,
    emoji: '💰',
    type: 'expense',
    isActive: true,
  };

  const category = new Category({ ...defaultData, ...categoryData });
  await category.save();
  return category;
};

/**
 * Create a test account type
 */
export const createAccountTypeFactory = async (accountTypeData = {}) => {
  const defaultData = {
    type: `TestType${Date.now()}`,
    accountName: 'Test Account Type',
    interestRate: 0,
    goalAmount: 0,
    currentBalance: 0,
  };

  // Use the base AccountType model or discriminator
  const accountType = new AccountType({ ...defaultData, ...accountTypeData });
  await accountType.save();
  return accountType;
};
