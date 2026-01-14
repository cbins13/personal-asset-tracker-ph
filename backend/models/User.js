import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    picture: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      // Only required if not using OAuth
      required: function() {
        return !this.googleId;
      },
    },
    provider: {
      type: String,
      enum: ['google', 'local'],
      default: 'local',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    // Additional user data can be stored here
    preferences: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Role-based access control
    roles: {
      type: [String],
      default: ['user'],
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Note: email and googleId indexes are automatically created by the 'unique: true' option
// No need to manually create them to avoid duplicate index warnings

const User = mongoose.model('User', userSchema);

export default User;
