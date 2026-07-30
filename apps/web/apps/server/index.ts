/**
 * Express Server Entry Point
 */

import dotenv from 'dotenv';
import path from 'path';
if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
}

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
import unifiedAuthRoutes from './routes/unifiedAuthRoutes';
import adminStaffRoutes from './routes/adminStaffRoutes';
import forgotPasswordRoutes from './routes/forgotPasswordRoutes';
import claimRoutes from './routes/claimRoutes';
import householdListRoutes from './routes/householdListRoutes';
import reportRoutes from './routes/reportRoutes';
import notificationRoutes from './routes/notificationRoutes';
import profileRoutes from './routes/profileRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import authRoutes from './routes/authRoutes';
import verificationRoutes from './routes/verificationRoutes';
import beneficiaryRoutes from './routes/beneficiaryRoutes';

import { requireAuth, requireStaffOrSuperadmin } from './middleware/unifiedAuth';
import { generalRateLimiter } from './middleware/rateLimiter';
import { mongoSanitize } from './validation/mongoSanitize';
import { csrfProtect } from './middleware/csrf';

import {
  enforceHTTPSInProduction,
  getAllowedCorsOrigins,
  isPrivateDevOrigin,
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
      const isDevPrivateOrigin = env.NODE_ENV !== 'production' && !!origin && isPrivateDevOrigin(origin);

      if (!origin || allowAllOrigins || allowedOrigins.includes(origin) || isDevPrivateOrigin) {
        callback(null, true);
        return;
      }

      // Reject cleanly without converting this into an application error.
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
// Legacy /api/sa login path disabled to prevent bypassing unified OTP flow.
app.use('/api/admin/users', adminStaffRoutes); // SUPERADMIN manage staff

app.use('/api/users', profileRoutes); // /api/users/me/* (must be before userRoutes)
app.use('/api/users', userRoutes);

app.use('/api/residents', residentRoutes); // route-level auth (register is public)
app.use('/api/face', faceRoutes); // route-level auth where needed
app.use('/api/household', householdRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);

app.use('/api/admin/tokens', adminTokenRoutes);

app.use('/api/distributions', requireAuth, requireStaffOrSuperadmin, distributionRoutes);
app.use('/api/claims', requireAuth, requireStaffOrSuperadmin, claimRoutes);
app.use('/api/households', requireAuth, requireStaffOrSuperadmin, householdListRoutes);
app.use('/api/reports', requireAuth, requireStaffOrSuperadmin, reportRoutes);
app.use('/api/audit-logs', requireAuth, requireStaffOrSuperadmin, auditLogRoutes);

app.use('/api/notifications', notificationRoutes); // Basic health check route
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    debug: {
      hasEmail: !!process.env.SUPERADMIN_EMAIL,
      email: process.env.SUPERADMIN_EMAIL,
      hasHash: !!process.env.SUPERADMIN_PASSWORD_HASH,
      hash: process.env.SUPERADMIN_PASSWORD_HASH,
    }
  });
});

app.get('/api/debug-db', async (_req, res) => {
  try {
    const mongoose = require('mongoose');
    const StaffUser = require('./models/StaffUser').default;
    const Resident = require('./models/Resident').default;
    
    const staff = await StaffUser.find({});
    const residents = await Resident.find({}).select('+password');
    
    res.json({
      staffCount: staff.length,
      staff: staff,
      residentCount: residents.length,
      residents: residents,
      dbState: mongoose.connection.readyState
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚡️ Server is running on port ${PORT} [0.0.0.0] [${env.NODE_ENV}]`);
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

process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

export default app;
