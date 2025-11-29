import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

export const connectDatabase = async (): Promise<boolean> => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return true;
    }

    // Connection options with timeouts for serverless
    const connectionOptions = {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 10000, // 10 seconds connection timeout
      maxPoolSize: 10,
      minPoolSize: 1,
    };

    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string prefix:', config.mongodbUri.substring(0, 20) + '...');
    
    await mongoose.connect(config.mongodbUri, connectionOptions);
    
    console.log('MongoDB connection established');
    logger.database('Connected to MongoDB');
    
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      logger.error('MongoDB connection error', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      logger.database('MongoDB reconnected');
    });
    
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    logger.error('Failed to connect to MongoDB', error as Error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
};

