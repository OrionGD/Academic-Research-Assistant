import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * MongoDB Connection Helper
 * Provides robust connection logic with error handling and lifecycle logging.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!uri) {
    logger.error('CRITICAL: MONGODB_URI/DATABASE_URL is missing in environment variables.');
    process.exit(1);
  }

  // Mask credentials for logging
  const maskedUri = uri.replace(/\/\/.*@/, '//****:****@');
  logger.info(`Attempting to connect to MongoDB: ${maskedUri}`);

  const options: mongoose.ConnectOptions = {
    // Production settings
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
  };

  // Connection Event Listeners
  mongoose.connection.on('connected', () => {
    logger.info('✓ MongoDB Connection Established');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB Connection Error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB Connection Lost. Attempting to reconnect...');
  });

  try {
    await mongoose.connect(uri, options);
  } catch (error) {
    logger.error('Failed to connect to MongoDB during startup:', error);
    process.exit(1);
  }
};
