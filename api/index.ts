import 'reflect-metadata';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from '../src/config/index.js';
import { connectDatabase } from '../src/config/database.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

// Import routes
import { authRoutes } from '../src/routes/auth.routes.js';
import { productRoutes } from '../src/routes/product.routes.js';
import { categoryRoutes } from '../src/routes/category.routes.js';
import { settingsRoutes } from '../src/routes/settings.routes.js';
import { uploadRoutes } from '../src/routes/upload.routes.js';
import { orderRoutes } from '../src/routes/order.routes.js';
import { configRoutes } from '../src/routes/config.routes.js';

// Import services for DI registration
import '../src/container.js';

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

// Connect to database on cold start (Vercel serverless)
let dbConnected = false;

const ensureDatabaseConnection = async () => {
  if (!dbConnected) {
    try {
      await connectDatabase();
      dbConnected = true;
    } catch (error) {
      console.error('Failed to connect to database:', error);
      // Don't throw - allow the function to continue
      // Database connection will be retried on next request
    }
  }
};

// Vercel serverless function handler
export default async (req: express.Request, res: express.Response) => {
  // Ensure database is connected
  await ensureDatabaseConnection();
  
  // Handle the request
  return app(req, res);
};

