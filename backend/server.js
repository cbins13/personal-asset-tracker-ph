import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import permissionRoutes from './routes/permissions.js';
import roleRoutes from './routes/roles.js';
import { sessionMiddleware, sessionLogger } from './middleware/session.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration with MongoDB store
app.use(
  session({
    name: 'sessionId', // Custom session name
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days in seconds
      autoRemove: 'native', // Use MongoDB's native TTL
      touchAfter: 24 * 3600, // Lazy session update (1 day)
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // CSRF protection
    },
    rolling: true, // Reset expiration on every request
  })
);

// Session middleware (apply after session configuration)
app.use(sessionMiddleware);
if (process.env.NODE_ENV === 'development') {
  app.use(sessionLogger);
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);

// 404 handler (must come before error handler)
app.use((req, res) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`404 - Route not found: ${req.method} ${req.path}`);
  }
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must have 4 parameters and come last)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ 
    error: 'Something went wrong!', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

app.listen(PORT, 'localhost', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
