import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';

const router: Router = Router();

const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required')
});

const googleCodeSchema = z.object({
  code: z.string().min(1, 'Authorization code is required')
});

// Get Google OAuth URL (for redirect flow)
router.get('/google/url', (req: Request, res: Response) => {
  const authService = container.resolve<AuthService>('AuthService');
  const url = authService.getGoogleAuthUrl();
  res.json({ url });
});

// Exchange authorization code for tokens (secure flow with client secret)
router.post('/google/callback', async (req: Request, res: Response) => {
  const { code } = googleCodeSchema.parse(req.body);
  
  const authService = container.resolve<AuthService>('AuthService');
  
  // Exchange code for tokens (uses client secret on server)
  const googleUser = await authService.exchangeCodeForTokens(code);
  
  // Find or create user
  const user = await authService.findOrCreateUser(googleUser);
  
  // Generate JWT
  const token = authService.generateToken(user);
  
  res.json({
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role
    }
  });
});

// Google OAuth with ID token (legacy/alternative flow)
router.post('/google', async (req: Request, res: Response) => {
  const { idToken } = googleAuthSchema.parse(req.body);
  
  const authService = container.resolve<AuthService>('AuthService');
  
  // Verify Google token
  const googleUser = await authService.verifyGoogleToken(idToken);
  
  // Find or create user
  const user = await authService.findOrCreateUser(googleUser);
  
  // Generate JWT
  const token = authService.generateToken(user);
  
  res.json({
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role
    }
  });
});

// Validate admin access
router.get('/validate-admin', authenticate, async (req: Request, res: Response) => {
  const authService = container.resolve<AuthService>('AuthService');
  
  const token = req.headers.authorization?.substring(7) || '';
  const { isAdmin, user } = await authService.validateAdminAccess(token);
  
  if (!isAdmin) {
    res.status(403).json({ 
      isAdmin: false,
      message: 'Admin access denied' 
    });
    return;
  }
  
  res.json({
    isAdmin: true,
    user: {
      id: user!._id,
      email: user!.email,
      name: user!.name,
      role: user!.role
    }
  });
});

// Get current user
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const authService = container.resolve<AuthService>('AuthService');
  
  const user = await authService.getUserById(req.user!.userId);
  
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  
  res.json({
    id: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    role: user.role
  });
});

export { router as authRoutes };

