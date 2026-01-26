import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema(
  {
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

providerSchema.index({ providerId: 1, type: 1 }, { unique: true });

const Provider = mongoose.model('Provider', providerSchema);

export default Provider;
