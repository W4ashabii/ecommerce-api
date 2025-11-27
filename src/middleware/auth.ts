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

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
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
    res.status(403).json({ error: 'Admin access denied' });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
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

