import dotenv from 'dotenv';
import connectDB from './config/database.js';
import app from './app.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'testing'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
