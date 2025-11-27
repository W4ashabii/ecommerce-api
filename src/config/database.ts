import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

export const connectDatabase = async (): Promise<boolean> => {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.database('Connected to MongoDB');
    
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.database('MongoDB reconnected');
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error as Error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
};

