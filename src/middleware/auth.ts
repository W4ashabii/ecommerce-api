import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { AuthService, TokenPayload } from '../services/auth.service.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Helper to get token from cookie or Authorization header
const getToken = (req: Request): string | null => {
  // First try HTTP-only cookie
  const cookieToken = req.cookies?.auth_token;
  if (cookieToken) {
    return cookieToken;
  }
  
  // Fallback to Authorization header (for backward compatibility)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = getToken(req);

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const authService = container.resolve<AuthService>('AuthService');
    
    const payload = authService.verifyToken(token);
    req.user = payload;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = getToken(req);

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const authService = container.resolve<AuthService>('AuthService');
    
    const { isAdmin, user } = await authService.validateAdminAccess(token);
    
    if (!isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    req.user = {
      userId: user!._id.toString(),
      email: user!.email,
      role: user!.role
    };
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(403).json({ error: 'Admin access denied' });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = getToken(req);

    if (token) {
      const authService = container.resolve<AuthService>('AuthService');
      
      try {
        const payload = authService.verifyToken(token);
        req.user = payload;
      } catch {
        // Token invalid, continue without user
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};


