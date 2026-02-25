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
import profileRoutes from './routes/profileRoutes';
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
import { assertBlockchainReady } from './services/blockchainService';
import { startClaimConfirmationWorker } from './services/claimConfirmationWorker';

const app: Express = express();
const PORT = env.PORT;

// [SECURITY CHECKLIST §2.3] Security headers via Helmet (HSTS, X-Content-Type, etc.)
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
// [SECURITY CHECKLIST §3.4] Enforce HTTPS in production (TLS transport security)
app.use(enforceHTTPSInProduction);

// [SECURITY CHECKLIST §2.3] CORS origin whitelist — blocks cross-origin abuse
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
// [SECURITY CHECKLIST §2.3] NoSQL Injection Protection — Layer 1: reject $-prefixed / dot keys
app.use(rejectNoSQLInjection);

// [SECURITY CHECKLIST §2.3] NoSQL Injection Protection — Layer 2: strip $-prefixed / dot keys
app.use(mongoSanitize);

// [SECURITY CHECKLIST §1.4] Rate Limiting — global 500 req / 15 min per IP
app.use(generalRateLimiter);

// [SECURITY CHECKLIST §2.4] CSRF Protection — double-submit cookie pattern
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
// [RISK-5 UI FIX] Mount self-service profile routes before generic /api/users/:id routes.
app.use('/api/users', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/residents', residentRoutes);       // route-level auth (register is public)
app.use('/api/face', faceRoutes);                // route-level auth where needed
app.use('/api/household', householdRoutes);
app.use('/api/admin/tokens', adminTokenRoutes);
// [SECURITY CHECKLIST §3.2] RBAC — mount-level auth + role guards on protected routes
app.use('/api/distributions', requireAuth, requireStaffOrSuperadmin, distributionRoutes);
app.use('/api/claims', requireAuth, requireStaffOrSuperadmin, claimRoutes);
app.use('/api/households', requireAuth, requireStaffOrSuperadmin, householdListRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// [SECURITY CHECKLIST §1.3] Error handling — generic messages, no stack traces leaked
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    await assertBlockchainReady();
    startClaimConfirmationWorker();

    app.listen(PORT, () => {
      console.log(`⚡️ Server is running on port ${PORT} [${env.NODE_ENV}]`);
      console.log(`🔐 Authentication endpoints available at /api/auth`);
      console.log(`🏠 Household registration available at /api/household`);
      console.log(`🎫 Admin token management available at /api/admin/tokens`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
