import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: {
      type: [String], // Array of permission names (e.g., ['users:read', 'assets:write'])
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystemRole: {
      type: Boolean,
      default: false, // System roles (like 'admin', 'user') cannot be deleted
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
// Note: name index is automatically created by 'unique: true' option
roleSchema.index({ isActive: 1 });

// Pre-save middleware to ensure name is lowercase
roleSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase();
  }
  next();
});

const Role = mongoose.model('Role', roleSchema);

export default Role;
