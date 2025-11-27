import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'development-secret-key',
  jwtExpiresIn: '7d',
  
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },
  
  // Admin emails (comma-separated in env)
  allowedAdminEmails: (process.env.ALLOWED_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()),
  
  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};

// Validate required config
export const validateConfig = () => {
  const required = ['jwtSecret', 'googleClientId'];
  const missing = required.filter(key => !config[key as keyof typeof config]);
  
  if (missing.length > 0 && config.nodeEnv === 'production') {
    throw new Error(`Missing required config: ${missing.join(', ')}`);
  }
  
  if (config.allowedAdminEmails.length === 0 || config.allowedAdminEmails[0] === '') {
    console.warn('⚠️ No admin emails configured. Admin access will be denied.');
  }
};

