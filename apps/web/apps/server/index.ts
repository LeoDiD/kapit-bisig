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
import reportRoutes from './routes/reportRoutes';
import notificationRoutes from './routes/notificationRoutes';
import profileRoutes from './routes/profileRoutes';
import authRoutes from './routes/authRoutes';
import {
  startClaimConfirmationWorker,
  stopClaimConfirmationWorker,
} from './services/claimConfirmationWorker';

import { requireAuth, requireStaffOrSuperadmin } from './middleware/unifiedAuth';
import { generalRateLimiter } from './middleware/rateLimiter';
import { mongoSanitize } from './validation/mongoSanitize';
import { csrfProtect } from './middleware/csrf';

import {
  enforceHTTPSInProduction,
  getAllowedCorsOrigins,
  rejectNoSQLInjection,
} from './middleware/securityHardening';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

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

// CORS configuration
const allowedOrigins = getAllowedCorsOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      const allowAllOrigins = allowedOrigins.includes('*');

      if (!origin || allowAllOrigins || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS origin not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(rejectNoSQLInjection);

// Serve uploaded files (avatars, etc.)
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'public', 'uploads')));

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
app.use('/api/auth', unifiedAuthRoutes); // unified login / logout / me
app.use('/api/mobile-auth', authRoutes); // token-based auth for mobile Volunteer app
app.use('/api/auth/forgot-password', forgotPasswordRoutes); // forgot password OTP flow
app.use('/api/sa', superadminAuthRoutes); // legacy superadmin-only routes (kept for compat)
app.use('/api/admin/users', adminStaffRoutes); // SUPERADMIN manage staff

app.use('/api/users', profileRoutes); // /api/users/me/* (must be before userRoutes)
app.use('/api/users', userRoutes);

app.use('/api/residents', residentRoutes); // route-level auth (register is public)
app.use('/api/face', faceRoutes); // route-level auth where needed
app.use('/api/household', householdRoutes);

app.use('/api/admin/tokens', adminTokenRoutes);

app.use('/api/distributions', requireAuth, requireStaffOrSuperadmin, distributionRoutes);
app.use('/api/claims', requireAuth, requireStaffOrSuperadmin, claimRoutes);
app.use('/api/households', requireAuth, requireStaffOrSuperadmin, householdListRoutes);
app.use('/api/reports', requireAuth, requireStaffOrSuperadmin, reportRoutes);

app.use('/api/notifications', notificationRoutes); // auth applied inside router

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
      console.log(`⚡️ Server is running on port ${PORT} [${env.NODE_ENV}]`);
      console.log(`🔐 Authentication endpoints available at /api/auth`);
      console.log(`🏠 Household registration available at /api/household`);
      console.log(`🎫 Admin token management available at /api/admin/tokens`);
      startClaimConfirmationWorker();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', () => {
  stopClaimConfirmationWorker();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopClaimConfirmationWorker();
  process.exit(0);
});

export default app;
