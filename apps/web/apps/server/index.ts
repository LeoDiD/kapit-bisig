/**
 * Express Server Entry Point
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

// Validate env vars immediately — exits if any required var is missing
import { env } from './config/env';

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
import forgotPasswordRoutes from './routes/forgotPasswordRoutes';
import claimRoutes from './routes/claimRoutes';
import householdListRoutes from './routes/householdListRoutes';
import notificationRoutes from './routes/notificationRoutes';
import profileRoutes from './routes/profileRoutes';
import { requireAuth, requireStaffOrSuperadmin } from './middleware/unifiedAuth';
import { generalRateLimiter } from './middleware/rateLimiter';
<<<<<<< Updated upstream
import { mongoSanitize } from './validation/mongoSanitize';
import { csrfProtect } from './middleware/csrf';
=======
import {
  enforceHTTPSInProduction,
  getAllowedCorsOrigins,
  rejectNoSQLInjection,
} from './middleware/securityHardening';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
>>>>>>> Stashed changes

const app: Express = express();
const PORT = env.PORT;

app.use(
  helmet({
    hsts:
      process.env.NODE_ENV === 'production'
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
  })
);

app.set('trust proxy', 1);

app.use(cookieParser());
app.use(enforceHTTPSInProduction);

<<<<<<< Updated upstream
// CORS configuration
// In production, restrict to your specific domains
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
}));
=======
const allowedOrigins = getAllowedCorsOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS origin not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
>>>>>>> Stashed changes

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(rejectNoSQLInjection);

<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
// Serve uploaded files (avatars, etc.)
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'public', 'uploads')));

>>>>>>> Stashed changes
// NoSQL injection sanitizer — strip $ and . keys from body/query/params
app.use(mongoSanitize);

// Apply general rate limiting to all routes
app.use(generalRateLimiter);

// CSRF protection (double-submit cookie)
app.use(csrfProtect);

/**
 * Routes
 * 
 * Authentication routes have additional rate limiting
 * applied at the route level (see authRoutes.ts)
 */
app.use('/api/auth', unifiedAuthRoutes);       // unified login / logout / me
app.use('/api/auth/forgot-password', forgotPasswordRoutes); // forgot password OTP flow
app.use('/api/sa', superadminAuthRoutes);        // legacy superadmin-only routes (kept for compat)
app.use('/api/admin/users', adminStaffRoutes);   // SUPERADMIN manage staff
<<<<<<< Updated upstream
=======
app.use(generalRateLimiter);

app.use('/api/auth', unifiedAuthRoutes);
app.use('/api/sa', superadminAuthRoutes);
app.use('/api/admin/users', adminStaffRoutes);
>>>>>>> Stashed changes
=======
app.use('/api/users', profileRoutes);                    // /api/users/me/* (must be before userRoutes)
>>>>>>> Stashed changes
app.use('/api/users', userRoutes);
app.use('/api/residents', residentRoutes);       // route-level auth (register is public)
app.use('/api/face', faceRoutes);                // route-level auth where needed
app.use('/api/household', householdRoutes);
app.use('/api/admin/tokens', adminTokenRoutes);
app.use('/api/distributions', requireAuth, requireStaffOrSuperadmin, distributionRoutes);
app.use('/api/claims', requireAuth, requireStaffOrSuperadmin, claimRoutes);
app.use('/api/households', requireAuth, requireStaffOrSuperadmin, householdListRoutes);
app.use('/api/notifications', notificationRoutes);       // auth applied inside router

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
<<<<<<< Updated upstream
      console.log(`⚡️ Server is running on port ${PORT} [${env.NODE_ENV}]`);
      console.log(`🔐 Authentication endpoints available at /api/auth`);
      console.log(`🏠 Household registration available at /api/household`);
      console.log(`🎫 Admin token management available at /api/admin/tokens`);
=======
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('Authentication endpoints available at /api/auth');
      console.log('Household registration available at /api/household');
      console.log('Admin token management available at /api/admin/tokens');
>>>>>>> Stashed changes
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
