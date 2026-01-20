import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    emoji: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      default: 'expense',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model('Category', categorySchema);

export default Category;
