import 'reflect-metadata';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Import routes
import { authRoutes } from './routes/auth.routes.js';
import { productRoutes } from './routes/product.routes.js';
import { categoryRoutes } from './routes/category.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';
import { orderRoutes } from './routes/order.routes.js';
import { configRoutes } from './routes/config.routes.js';

// Import services for DI registration
import './container.js';

const app: ReturnType<typeof express> = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/config', configRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Show banner
    logger.banner();
    
    // Connect to database
    logger.section('Connecting to services...');
    const dbConnected = await connectDatabase();
    
    // Start listening
    app.listen(config.port, () => {
      // Show startup summary
      logger.startupSummary({
        port: config.port,
        env: config.nodeEnv,
        mongoConnected: dbConnected,
        cloudinaryConfigured: !!(config.cloudinary.cloudName && config.cloudinary.apiKey),
        googleAuthConfigured: !!(config.googleClientId && config.googleClientSecret),
        adminEmails: config.allowedAdminEmails,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
};

startServer();

export default app;

