import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import permissionRoutes from './routes/permissions.js';
import roleRoutes from './routes/roles.js';
import accountRoutes from './routes/accounts.js';
import accountTypeRoutes from './routes/accountTypes.js';
import transactionRoutes from './routes/transactions.js';
import categoryRoutes from './routes/categories.js';
import { sessionMiddleware, sessionLogger } from './middleware/session.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration with MongoDB store
const sessionConfig = {
  name: 'sessionId',
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
  rolling: true,
};

// Only use MongoDB store if MONGODB_URI is provided (not in test environment)
let mongoStoreInstance = null;
if (process.env.MONGODB_URI && process.env.NODE_ENV !== 'test') {
  mongoStoreInstance = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60,
    autoRemove: 'native',
    touchAfter: 24 * 3600,
  });
  sessionConfig.store = mongoStoreInstance;
}

// Export store instance for cleanup in tests
export const getMongoStore = () => mongoStoreInstance;

app.use(session(sessionConfig));

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
app.use('/api/accounts', accountRoutes);
app.use('/api/account-types', accountTypeRoutes);
app.use('/api/accountTypes', accountTypeRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);

// 404 handler (must come before error handler)
app.use((req, res) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`404 - Route not found: ${req.method} ${req.path}`);
  }
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handling middleware (must have 4 parameters and come last)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ 
    success: false,
    error: 'Something went wrong!', 
    details: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

export default app;
