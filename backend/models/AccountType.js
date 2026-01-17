import mongoose from 'mongoose';

const accountTypeSchema = new mongoose.Schema(
  {},
  {
    discriminatorKey: 'type',
    timestamps: true,
  }
);

const AccountType = mongoose.model('AccountType', accountTypeSchema);

const savingsTypeSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: true,
    trim: true,
  },
  interestRate: {
    type: Number,
    required: true,
  },
  goalAmount: {
    type: Number,
    required: true,
  },
  currentBalance: {
    type: Number,
    required: true,
  },
});

const walletTypeSchema = new mongoose.Schema({
  walletName: {
    type: String,
    required: true,
    trim: true,
  },
  currentBalance: {
    type: Number,
    required: true,
  },
});

const investmentsTypeSchema = new mongoose.Schema({
  investmentName: {
    type: String,
    required: true,
    trim: true,
  },
  startingBalance: {
    type: Number,
    required: true,
  },
  interestRate: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

const creditTypeSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: true,
    trim: true,
  },
  currentBalance: {
    type: Number,
    required: true,
  },
});

const loansTypeSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: true,
    trim: true,
  },
  currentBalance: {
    type: Number,
    required: true,
  },
});

AccountType.discriminator('Savings', savingsTypeSchema);
AccountType.discriminator('Wallet', walletTypeSchema);
AccountType.discriminator('Investments', investmentsTypeSchema);
AccountType.discriminator('Credit', creditTypeSchema);
AccountType.discriminator('Loans', loansTypeSchema);

export default AccountType;
