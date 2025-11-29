import 'reflect-metadata';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
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
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbConnected = dbStatus === 1;
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        state: dbStatus === 0 ? 'disconnected' : dbStatus === 1 ? 'connected' : dbStatus === 2 ? 'connecting' : 'disconnecting'
      },
      environment: {
        nodeEnv: config.nodeEnv,
        hasMongoUri: !!config.mongodbUri,
        hasJwtSecret: !!config.jwtSecret,
        hasGoogleClientId: !!config.googleClientId,
        frontendUrl: config.frontendUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Diagnostic endpoint
app.get('/diagnostic', async (req, res) => {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      database: {
        readyState: mongoose.connection.readyState,
        state: mongoose.connection.readyState === 0 ? 'disconnected' : 
               mongoose.connection.readyState === 1 ? 'connected' : 
               mongoose.connection.readyState === 2 ? 'connecting' : 'disconnecting',
        host: mongoose.connection.host || 'not connected',
        name: mongoose.connection.name || 'not connected'
      },
      config: {
        nodeEnv: config.nodeEnv,
        hasMongoUri: !!config.mongodbUri,
        mongoUriPrefix: config.mongodbUri ? config.mongodbUri.substring(0, 20) + '...' : 'missing',
        hasJwtSecret: !!config.jwtSecret,
        hasGoogleClientId: !!config.googleClientId,
        googleClientIdPrefix: config.googleClientId ? config.googleClientId.substring(0, 30) + '...' : 'missing',
        hasGoogleClientSecret: !!config.googleClientSecret,
        frontendUrl: config.frontendUrl
      }
    };

    // Try to test database connection
    if (mongoose.connection.readyState !== 1) {
      try {
        await ensureDatabaseConnection();
        diagnostics.database.testConnection = 'attempted';
      } catch (error) {
        diagnostics.database.testConnectionError = error instanceof Error ? error.message : 'Unknown error';
      }
    } else {
      diagnostics.database.testConnection = 'already connected';
    }

    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
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
let dbConnecting = false;

const ensureDatabaseConnection = async () => {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }
  
  // If connection is in progress, wait with timeout
  if (mongoose.connection.readyState === 2) {
    console.log('Database connection in progress, waiting...');
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Database connection timeout - proceeding without connection');
        resolve(); // Don't block requests
      }, 3000); // 3 second timeout
      
      mongoose.connection.once('connected', () => {
        clearTimeout(timeout);
        console.log('Database connected after wait');
        resolve();
      });
      
      mongoose.connection.once('error', (error) => {
        clearTimeout(timeout);
        console.error('Database connection error during wait:', error);
        resolve(); // Don't block on error
      });
    });
  }
  
  // Prevent multiple simultaneous connection attempts
  if (dbConnecting) {
    console.log('Database connection already in progress, skipping...');
    return;
  }
  
  dbConnecting = true;
  try {
    console.log('Initiating database connection...');
    await connectDatabase();
    console.log('Database connection successful');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    // Don't throw - allow the function to continue
    // Database connection will be retried on next request
  } finally {
    dbConnecting = false;
  }
};

// Initialize database connection on module load (for Vercel serverless)
// This will be reused across function invocations
let dbInitialized = false;

const initializeDatabase = async () => {
  if (!dbInitialized) {
    try {
      await ensureDatabaseConnection();
      dbInitialized = true;
      console.log('Database connection initialized');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Don't throw - will retry on first request
    }
  }
};

// Initialize on module load
initializeDatabase().catch(console.error);

// Vercel serverless function handler - routes all requests through Express
const handler = async (req: express.Request, res: express.Response) => {
  try {
    // Ensure database is connected
    await ensureDatabaseConnection();
    
    // Handle the request through Express app
    return app(req, res);
  } catch (error) {
    console.error('Request handler error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

export default handler;

