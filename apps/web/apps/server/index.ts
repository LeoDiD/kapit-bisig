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
import { connectDB } from './config/database';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
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

// CORS configuration
// In production, restrict to your specific domains
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply general rate limiting to all routes
app.use(generalRateLimiter);

/**
 * Routes
 * 
 * Authentication routes have additional rate limiting
 * applied at the route level (see authRoutes.ts)
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

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
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
