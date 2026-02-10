/**
 * Express Server Entry Point
 * 
 * Main server configuration with security middleware.
 * 
 * Security Features:
 * - Helmet for HTTP security headers
 * - CORS with configured origins
 * - Rate limiting on all routes
 * - Secure authentication endpoints
 */

// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/database';
import userRoutes from './routes/userRoutes';
import residentRoutes from './routes/residentRoutes';
import faceRoutes from './routes/faceRoutes';
import householdRoutes from './routes/householdRoutes';
import adminTokenRoutes from './routes/adminTokenRoutes';
import distributionRoutes from './routes/distributionRoutes';
import superadminAuthRoutes from './routes/superadminAuthRoutes';
import unifiedAuthRoutes from './routes/unifiedAuthRoutes';
import adminStaffRoutes from './routes/adminStaffRoutes';
import { requireAuth, requireStaffOrSuperadmin } from './middleware/unifiedAuth';
import { generalRateLimiter } from './middleware/rateLimiter';

const app: Express = express();
const PORT = process.env.PORT || 3001;

/**
 * Security Middleware - Order matters!
 */

// Helmet: Sets various HTTP headers for security
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection
// - And more...
app.use(helmet());

// Trust proxy - Required for rate limiting behind reverse proxy
// Set to 1 if behind single proxy (like nginx)
app.set('trust proxy', 1);

// Cookie parser — needed for httpOnly auth cookies
app.use(cookieParser());

// CORS configuration
// In production, restrict to your specific domains
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Body parsing middleware
// Increased limit for base64 images from mobile registration
app.use(express.json({ limit: '50mb' })); // Limit body size to prevent DoS
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply general rate limiting to all routes
app.use(generalRateLimiter);

/**
 * Routes
 * 
 * Authentication routes have additional rate limiting
 * applied at the route level (see authRoutes.ts)
 */
app.use('/api/auth', unifiedAuthRoutes);       // unified login / logout / me
app.use('/api/sa', superadminAuthRoutes);        // legacy superadmin-only routes (kept for compat)
app.use('/api/admin/users', adminStaffRoutes);   // SUPERADMIN manage staff
app.use('/api/users', userRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/household', householdRoutes);
app.use('/api/admin/tokens', adminTokenRoutes);
app.use('/api/distributions', requireAuth, requireStaffOrSuperadmin, distributionRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Start server with database connection
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Then start the server
    app.listen(PORT, () => {
      console.log(`⚡️ Server is running on http://localhost:${PORT}`);
      console.log(`🔐 Authentication endpoints available at /api/auth`);
      console.log(`🏠 Household registration available at /api/household`);
      console.log(`🎫 Admin token management available at /api/admin/tokens`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
