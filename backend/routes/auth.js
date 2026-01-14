import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';

const router = express.Router();
// OAuth2Client is created dynamically with the Client ID from the request

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Google OAuth verification and login
router.post('/google', async (req, res) => {
  try {
    const { credential, clientId } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Credential is required' });
    }

    // Use clientId from request if provided, otherwise use env variable
    // This ensures the backend uses the same Client ID as the frontend
    const googleClientId = clientId || process.env.GOOGLE_CLIENT_ID;
    
    if (!googleClientId) {
      return res.status(500).json({ error: 'Google Client ID not configured' });
    }

    // Create a new OAuth2Client with the correct Client ID
    const oauthClient = new OAuth2Client(googleClientId);

    // Verify the Google token
    // Accept multiple possible client IDs (frontend client ID and backend env client ID)
    const possibleClientIds = [
      googleClientId,
      ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== googleClientId 
        ? [process.env.GOOGLE_CLIENT_ID] 
        : [])
    ];

    let ticket;
    let lastError;
    
    // Try verifying with each possible client ID
    for (const audienceId of possibleClientIds) {
      try {
        ticket = await oauthClient.verifyIdToken({
          idToken: credential,
          audience: audienceId,
        });
        // Success - break out of loop
        break;
      } catch (error) {
        lastError = error;
        // Continue to next client ID
        continue;
      }
    }

    // If all attempts failed, throw the last error
    if (!ticket) {
      console.error('Google token verification failed:', lastError?.message);
      return res.status(401).json({ 
        error: 'Invalid Google token', 
        details: 'Token verification failed. Please try logging in again.' 
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.picture = picture;
        user.provider = 'google';
      } else {
        // Create new user
        user = new User({
          googleId,
          email,
          name,
          picture,
          provider: 'google',
        });
      }
    } else {
      // Update last login and picture if changed
      user.lastLogin = new Date();
      if (picture) user.picture = picture;
    }

    await user.save();

    // Create session - ensure session is saved
    req.session.userId = user._id.toString();
    req.session.userEmail = user.email;
    
    // Explicitly save session to ensure it's persisted
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data and token
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    // Provide more helpful error messages
    if (error.message && error.message.includes('audience')) {
      return res.status(401).json({ 
        error: 'Authentication failed', 
        details: 'Invalid Google Client ID configuration. Please check your environment variables.' 
      });
    }
    res.status(500).json({ 
      error: 'Authentication failed', 
      details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred during authentication' 
    });
  }
});

// Local email/password registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Hash password with bcrypt
    const hashedPassword = await hashPassword(password);

    // Create new user with hashed password
    const user = new User({
      email,
      password: hashedPassword,
      name,
      provider: 'local',
    });

    await user.save();

    // Create session
    req.session.userId = user._id.toString();
    req.session.userEmail = user.email;
    
    // Explicitly save session to ensure it's persisted
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        roles: user.roles,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Local email/password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email, provider: 'local' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password with bcrypt
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create session
    req.session.userId = user._id.toString();
    req.session.userEmail = user.email;
    
    // Explicitly save session to ensure it's persisted
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        roles: user.roles,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Get current user (from session)
router.get('/me', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        roles: user.roles,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user', details: error.message });
  }
});

export default router;
