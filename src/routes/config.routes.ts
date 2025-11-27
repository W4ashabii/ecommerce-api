import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';

const router: Router = Router();

/**
 * Public configuration endpoint
 * Exposes only safe, non-sensitive configuration to the frontend
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    // Google OAuth - client ID is public (used in browser)
    googleClientId: config.googleClientId,
    
    // Allowed admin emails (public - used for UI hints)
    allowedAdminEmails: config.allowedAdminEmails,
    
    // Cloudinary cloud name (public - used for image URLs)
    cloudinaryCloudName: config.cloudinary.cloudName,
    
    // App info
    appName: 'AMI',
    appVersion: '1.0.0',
  });
});

export { router as configRoutes };

