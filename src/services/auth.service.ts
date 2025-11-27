import { injectable } from 'tsyringe';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { config } from '../config/index.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

@injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(
      config.googleClientId,
      config.googleClientSecret,
      `${config.frontendUrl}/auth/callback`
    );
  }

  // Exchange authorization code for tokens (uses client secret)
  async exchangeCodeForTokens(code: string): Promise<GoogleUserInfo> {
    try {
      const { tokens } = await this.googleClient.getToken(code);
      
      if (!tokens.id_token) {
        throw new Error('No ID token received');
      }

      // Verify the ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: config.googleClientId
      });

      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        throw new Error('Invalid token payload');
      }

      return {
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
        sub: payload.sub
      };
    } catch (error) {
      console.error('Code exchange error:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  // Verify ID token directly (for backward compatibility)
  async verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: config.googleClientId
      });

      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        throw new Error('Invalid token payload');
      }

      return {
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
        sub: payload.sub
      };
    } catch (error) {
      throw new Error('Failed to verify Google token');
    }
  }

  // Generate Google OAuth URL
  getGoogleAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  isAdminEmail(email: string): boolean {
    return config.allowedAdminEmails.includes(email.toLowerCase());
  }

  async findOrCreateUser(googleUser: GoogleUserInfo): Promise<IUser> {
    let user = await User.findOne({ email: googleUser.email.toLowerCase() });

    if (!user) {
      const role = this.isAdminEmail(googleUser.email) ? 'admin' : 'customer';
      
      user = await User.create({
        email: googleUser.email.toLowerCase(),
        name: googleUser.name,
        picture: googleUser.picture,
        googleId: googleUser.sub,
        role
      });
    } else {
      // Update role if email is now in admin list
      if (this.isAdminEmail(googleUser.email) && user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }
      
      // Update picture if changed
      if (googleUser.picture && user.picture !== googleUser.picture) {
        user.picture = googleUser.picture;
        await user.save();
      }
    }

    return user;
  }

  generateToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as string
    } as jwt.SignOptions);
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async validateAdminAccess(token: string): Promise<{ isAdmin: boolean; user?: IUser }> {
    try {
      const payload = this.verifyToken(token);
      
      if (payload.role !== 'admin') {
        return { isAdmin: false };
      }

      const user = await User.findById(payload.userId);
      
      if (!user || user.role !== 'admin') {
        return { isAdmin: false };
      }

      // Double-check against allowed emails
      if (!this.isAdminEmail(user.email)) {
        return { isAdmin: false };
      }

      return { isAdmin: true, user };
    } catch (error) {
      return { isAdmin: false };
    }
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }
}

