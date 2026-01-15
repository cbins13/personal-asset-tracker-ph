import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      // Format: resource:action (e.g., users:read, assets:write)
      validate: {
        validator: function(v) {
          return /^[a-z0-9]+:[a-z0-9]+$/.test(v);
        },
        message: 'Permission name must be in format "resource:action" (e.g., users:read)',
      },
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    resource: {
      type: String,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      enum: ['user_management', 'asset_management', 'admin', 'other'],
      default: 'other',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to extract resource and action from name
permissionSchema.pre('save', function(next) {
  if (this.name && this.isModified('name')) {
    const parts = this.name.split(':');
    if (parts.length === 2) {
      this.resource = parts[0];
      this.action = parts[1];
    }
  }
  next();
});

// Index for faster lookups
permissionSchema.index({ resource: 1, action: 1 });
permissionSchema.index({ isActive: 1 });

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
