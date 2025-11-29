import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config/index.js';

const router: Router = Router();

const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required')
});

const googleCodeSchema = z.object({
  code: z.string().min(1, 'Authorization code is required')
});

const themeSchema = z.object({
  theme: z.enum(['light', 'dark'])
});

// Cookie options for JWT token
const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: config.nodeEnv === 'production' ? 'strict' as const : 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

// Get Google OAuth URL (for redirect flow)
router.get('/google/url', (req: Request, res: Response) => {
  const authService = container.resolve<AuthService>('AuthService');
  const url = authService.getGoogleAuthUrl();
  
  // Extract redirect_uri from the URL for debugging
  const urlObj = new URL(url);
  const redirectUri = urlObj.searchParams.get('redirect_uri');
  
  res.json({ 
    url,
    redirectUri: redirectUri || 'Not found in URL',
    frontendUrl: config.frontendUrl,
    expectedRedirectUri: `${config.frontendUrl}/auth/callback`
  });
});

// Exchange authorization code for tokens (secure flow with client secret)
router.post('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = googleCodeSchema.parse(req.body);
    
    const authService = container.resolve<AuthService>('AuthService');
    
    // Exchange code for tokens (uses client secret on server)
    const googleUser = await authService.exchangeCodeForTokens(code);
    
    // Find or create user
    const user = await authService.findOrCreateUser(googleUser);
    
    // Generate JWT
    const token = authService.generateToken(user);
    
    // Set HTTP-only cookie
    res.cookie('auth_token', token, getCookieOptions());
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        theme: user.theme
      }
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: req.body?.code ? 'Present' : 'Missing'
    });
    
    res.status(500).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
  
  // Set HTTP-only cookie
  res.cookie('auth_token', token, getCookieOptions());
  
  res.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      theme: user.theme
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
    role: user.role,
    theme: user.theme
  });
});

// Logout - clear cookie
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/',
  });
  res.json({ success: true });
});

// Update user theme preference
router.put('/theme', authenticate, async (req: Request, res: Response) => {
  const { theme } = themeSchema.parse(req.body);
  const authService = container.resolve<AuthService>('AuthService');
  
  const user = await authService.updateUserTheme(req.user!.userId, theme);
  
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  
  res.json({ theme: user.theme });
});

export { router as authRoutes };

