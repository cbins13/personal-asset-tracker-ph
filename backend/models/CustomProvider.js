import mongoose from 'mongoose';

const customProviderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    providerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    providerLabel: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    accent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

customProviderSchema.index({ userId: 1, providerId: 1, type: 1 }, { unique: true });
customProviderSchema.index({ userId: 1, providerLabel: 1, type: 1 }, { unique: true });

const CustomProvider = mongoose.model('CustomProvider', customProviderSchema);

export default CustomProvider;
