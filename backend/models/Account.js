import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Wallet', 'Savings', 'Credit', 'Loans', 'Investments', 'Assets'],
      required: true,
    },
    providerId: {
      type: String,
      trim: true,
    },
    providerLabel: {
      type: String,
      trim: true,
    },
    currentBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    addToNetWorth: {
      type: Boolean,
      default: true,
    },
    transactions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Account = mongoose.model('Account', accountSchema);

export default Account;
