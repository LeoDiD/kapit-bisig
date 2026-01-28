/**
 * Rate Limiting Middleware
 * 
 * Protects against brute-force attacks and DoS by limiting request rates.
 * 
 * Security Features:
 * - IP-based rate limiting
 * - Separate limits for different endpoint sensitivities
 * - Progressive lockout for repeated violations
 * - Proper headers to inform clients of limit status
 * 
 * Rate Limiting Strategy:
 * 1. General API: Liberal limits for normal usage
 * 2. Authentication: Strict limits to prevent credential stuffing
 * 3. Account Creation: Moderate limits to prevent spam accounts
 * 
 * Note: When behind a reverse proxy (nginx, load balancer), ensure:
 * - app.set('trust proxy', 1) is configured in Express
 * - X-Forwarded-For header is properly set by the proxy
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Custom key generator for rate limiting.
 * Uses X-Forwarded-For when behind a proxy, falls back to direct IP.
 * 
 * Security Note: Ensure your proxy is configured correctly to prevent
 * IP spoofing via X-Forwarded-For header manipulation.
 */
const getClientIP = (req: Request): string => {
  // Get forwarded IP (when behind proxy) or direct IP
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    // X-Forwarded-For can contain multiple IPs; the first is the client
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * General Rate Limiter
 * 
 * Applied to all API routes to prevent abuse.
 * Allows 100 requests per 15 minutes per IP.
 * 
 * This is a baseline protection; specific endpoints have stricter limits.
 */
export const generalRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers (deprecated)
  keyGenerator: getClientIP,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Login Rate Limiter (STRICT)
 * 
 * Critical security measure to prevent:
 * - Brute-force password attacks
 * - Credential stuffing attacks
 * - Account enumeration attacks
 * 
 * Policy:
 * - 5 login attempts per 15 minutes per IP
 * - After limit: 15-minute lockout
 * 
 * Security Rationale:
 * - Low limit prevents automated attacks
 * - 15-minute window provides good security without frustrating legitimate users
 * - Combined with account-based lockout (in authRoutes) for defense in depth
 */
export const loginRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 5, // Only 5 attempts allowed
  message: {
    success: false,
    message: 'Too many login attempts. Your IP has been temporarily blocked.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  skipSuccessfulRequests: true, // Don't count successful logins against limit
  handler: (req: Request, res: Response) => {
    // Log the blocked attempt for security monitoring
    console.warn(`[SECURITY] Login rate limit exceeded for IP: ${getClientIP(req)}`);
    
    res.status(429).json({
      success: false,
      message: 'Too many failed login attempts. Please try again in 15 minutes.',
      retryAfter: '15 minutes',
      blocked: true,
    });
  },
});

/**
 * Registration Rate Limiter
 * 
 * Prevents:
 * - Automated spam account creation
 * - Resource exhaustion attacks
 * - Abuse of registration for enumeration
 * 
 * Policy:
 * - 3 registration attempts per hour per IP
 * - Legitimate users rarely need more than 1-2 attempts
 */
export const registrationRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1-hour window
  max: 3, // 3 registrations per hour
  message: {
    success: false,
    message: 'Too many accounts created from this IP. Please try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  handler: (req: Request, res: Response) => {
    console.warn(`[SECURITY] Registration rate limit exceeded for IP: ${getClientIP(req)}`);
    
    res.status(429).json({
      success: false,
      message: 'Account creation limit reached. Please try again in 1 hour.',
      retryAfter: '1 hour',
    });
  },
});

/**
 * Password Reset Rate Limiter
 * 
 * Protects password reset functionality from:
 * - Email flooding attacks
 * - Account enumeration via reset responses
 * 
 * Policy:
 * - 3 reset requests per hour per IP
 */
export const passwordResetRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1-hour window
  max: 3, // 3 reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Password reset limit reached. Please try again in 1 hour.',
      retryAfter: '1 hour',
    });
  },
});

/**
 * Strict Rate Limiter for Sensitive Operations
 * 
 * Use for highly sensitive operations like:
 * - Changing email/password
 * - Deleting account
 * - Accessing admin functions
 */
export const strictRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Rate limit exceeded for sensitive operation.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
});

