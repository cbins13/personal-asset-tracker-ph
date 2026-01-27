import app from '../backend/app.js';
import connectDB from '../backend/config/database.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
    });
  }

  return app(req, res);
}
