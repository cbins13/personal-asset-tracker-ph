import { connectDB, clearDatabase, closeDatabase } from './helpers/database.js';

// Set test environment variables BEFORE importing app
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.JWT_SECRET = 'test-jwt-secret';
// MONGODB_URI will be set by mongodb-memory-server after connection
// Leave it undefined initially so app.js doesn't try to create MongoStore

// Connect to in-memory MongoDB before all tests
let mongoUri;
beforeAll(async () => {
  mongoUri = await connectDB();
  // Set MONGODB_URI after connection is established
  process.env.MONGODB_URI = mongoUri;
});

// Clear database before each test suite
beforeEach(async () => {
  await clearDatabase();
});

// Close database connection after all tests
afterAll(async () => {
  await closeDatabase();
}, 60000); // Increase timeout for cleanup

// Suppress console errors in tests (optional - comment out if you want to see them)
// Note: Uncomment if you want to suppress console output during tests
// const originalError = console.error;
// const originalWarn = console.warn;
// global.console.error = () => {};
// global.console.warn = () => {};
