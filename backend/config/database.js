import mongoose from 'mongoose';

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection || mongoose.connection.readyState === 1) {
    return cachedConnection || mongoose.connection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    // These options are recommended for MongoDB Atlas
    // useNewUrlParser: true, // Not needed in Mongoose 6+
    // useUnifiedTopology: true, // Not needed in Mongoose 6+
  });

  cachedConnection = conn.connection;
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return cachedConnection;
};

export default connectDB;
