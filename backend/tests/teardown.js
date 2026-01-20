import { closeDatabase } from './helpers/database.js';

// Close database connection after all tests
afterAll(async () => {
  await closeDatabase();
});
