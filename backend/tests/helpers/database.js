import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoReplSet;
let mongoStoreInstance = null;

// Function to set MongoStore instance for cleanup
export const setMongoStore = (store) => {
  mongoStoreInstance = store;
};

/**
 * Connect to in-memory MongoDB instance with replica set support for transactions
 * Transactions require a replica set, even if it's a single-node replica set
 */
export const connectDB = async () => {
  // Create MongoDB Memory Replica Set
  // This is required for MongoDB transactions to work
  mongoReplSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1, // Single-node replica set is sufficient for testing
      storageEngine: 'wiredTiger',
      name: 'rs0',
    },
  });
  
  const mongoUri = mongoReplSet.getUri();
  
  await mongoose.connect(mongoUri, {
    // Mongoose 6+ options
  });
  
  return mongoUri;
};

/**
 * Drop all collections in the database
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Close database connection and stop in-memory replica set
 */
export const closeDatabase = async () => {
  // Prevent multiple cleanup calls
  if (!mongoReplSet && mongoose.connection.readyState === 0) {
    return;
  }
  
  try {
    // Delete all mongoose models to clear event listeners
    mongoose.models = {};
    mongoose.modelSchemas = {};
    
    // Close mongoose connection first
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.connection.dropDatabase();
      } catch (err) {
        // Ignore errors if database doesn't exist or is already dropped
      }
      
      // Remove all event listeners before disconnecting
      mongoose.connection.removeAllListeners();
      
      // Use disconnect() instead of connection.close() for better cleanup
      await mongoose.disconnect();
    }
    
    // Close MongoStore connection if it exists
    if (mongoStoreInstance) {
      try {
        if (mongoStoreInstance.client && mongoStoreInstance.client.close) {
          await mongoStoreInstance.client.close();
        }
        mongoStoreInstance = null;
      } catch (err) {
        // Ignore errors if already closed
        mongoStoreInstance = null;
      }
    }
    
    // Stop replica set after mongoose is fully disconnected
    if (mongoReplSet) {
      try {
        await mongoReplSet.stop();
        mongoReplSet = null; // Clear reference to prevent double cleanup
      } catch (err) {
        // Ignore errors if already stopped
        mongoReplSet = null;
      }
    }
  } catch (error) {
    // Don't throw - allow cleanup to continue even if there are errors
    console.error('Error during database cleanup:', error);
    // Ensure mongoReplSet is cleared even on error
    mongoReplSet = null;
  }
};

/**
 * Get the current database connection
 */
export const getConnection = () => {
  return mongoose.connection;
};
