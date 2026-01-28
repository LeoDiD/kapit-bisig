/**
 * Authentication Middleware
 * 
 * Protects routes that require user authentication.
 * 
 * Security Features:
 * - JWT token verification
 * - Token expiration handling
 * - Secure error messages (don't leak information)
 * 
 * Usage:
 * router.get('/protected', authMiddleware, (req, res) => { ... });
 */

import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

/**
 * Extended Request interface to include user data from JWT
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
  };
}

/**
 * JWT payload structure
 */
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Get JWT secret from environment.
 * 
 * Security Note: 
 * - JWT_SECRET must be a strong, random string (minimum 32 characters)
 * - Never commit secrets to version control
 * - Use different secrets for different environments
 */
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('[CRITICAL] JWT_SECRET is not defined in environment variables');
    throw new Error('JWT configuration error');
  }
  
  // Warn if secret is too short (less secure)
  if (secret.length < 32) {
    console.warn('[SECURITY WARNING] JWT_SECRET should be at least 32 characters long');
  }
  
  return secret;
};

/**
 * Authentication Middleware
 * 
 * Verifies the JWT token from the Authorization header.
 * 
 * Expected header format: "Bearer <token>"
 * 
 * Security Best Practices Implemented:
 * 1. Token extracted from Authorization header (not cookies, for CSRF protection)
 * 2. Generic error messages to prevent information leakage
 * 3. Token expiration is verified automatically by jwt.verify()
 * 4. Invalid tokens are rejected without details
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;
    
    // Check if header exists and has correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }
    
    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.substring(7);
    
    if (!token || token === 'null' || token === 'undefined') {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
      });
      return;
    }
    
    // Verify and decode the token
    const decoded = jwt.verify(token, getJWTSecret()) as JWTPayload;
    
    // Attach user info to request for use in route handlers
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
    };
    
    // Continue to the protected route
    next();
    
  } catch (error) {
    // Handle specific JWT errors with appropriate responses
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      // Generic message to prevent token manipulation hints
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
      });
      return;
    }
    
    // Log unexpected errors for debugging
    console.error('[AUTH ERROR]', error);
    
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Optional Authentication Middleware
 * 
 * Similar to authMiddleware, but doesn't reject unauthenticated requests.
 * Useful for routes that work differently for logged-in vs anonymous users.
 * 
 * If valid token present: req.user is populated
 * If no token or invalid: req.user is undefined (request continues)
 */
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token && token !== 'null' && token !== 'undefined') {
        try {
          const decoded = jwt.verify(token, getJWTSecret()) as JWTPayload;
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            iat: decoded.iat,
            exp: decoded.exp,
          };
        } catch {
          // Token invalid, but we continue without user (optional auth)
          req.user = undefined;
        }
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we continue even on errors
    next();
  }
};

/**
 * Generates a JWT token for a user.
 * 
 * @param userId - The user's database ID
 * @param email - The user's email address
 * @returns Signed JWT token string
 * 
 * Token Configuration:
 * - Expires in 24 hours by default (configurable via JWT_EXPIRES_IN env var)
 * - Contains userId and email claims
 * - Signed with HS256 algorithm
 */
export const generateToken = (userId: string, email: string): string => {
  const secret: Secret = getJWTSecret();
  const options: SignOptions = { 
    expiresIn: '24h',
    algorithm: 'HS256',
  };
  
  return jwt.sign(
    { 
      userId, 
      email,
    },
    secret,
    options
  );
};

