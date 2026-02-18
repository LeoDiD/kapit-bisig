/**
 * Database Connection Module
 *
 * Connects to MongoDB using the URI from env validation (env.ts).
 *
 * TLS / Encryption:
 *   • If MONGODB_URI uses `mongodb+srv://` (Atlas), TLS is enabled by
 *     default by the driver — no extra flags needed.
 *   • For self-hosted MongoDB the URI should include `?tls=true` or the
 *     explicit options below will force TLS in production.
 *   • `tlsAllowInvalidCertificates` is always false in production to
 *     prevent MITM attacks.
 *
 * Connection pooling & timeouts are tuned for a typical web server
 * running on a single process behind a reverse proxy.
 */

import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    // env.ts already validates this, but guard anyway
    throw new Error('MONGODB_URI is not set');
  }

  const isProd = process.env.NODE_ENV === 'production';
  const isSrv = uri.startsWith('mongodb+srv://');

  try {
    const options: mongoose.ConnectOptions = {
      /* ── Connection pool ─────────────────────────────────── */
      maxPoolSize: 15,
      minPoolSize: 2,

      /* ── Timeouts ────────────────────────────────────────── */
      serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,

      /* ── TLS ─────────────────────────────────────────────── */
      // Atlas SRV connections enable TLS automatically.
      // For non-SRV production URIs we enforce TLS explicitly.
      ...(isProd && !isSrv ? { tls: true } : {}),
      // NEVER allow invalid certificates in production
      tlsAllowInvalidCertificates: false,

      /* ── Misc safety ─────────────────────────────────────── */
      autoIndex: !isProd, // disable auto-index in prod (run migrations)
    };

    // Disable mongoose debug logging in production to avoid leaking data
    mongoose.set('debug', !isProd);

    const conn = await mongoose.connect(uri, options);

    // Log host but NEVER the full URI (contains credentials)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
    if (isSrv) {
      console.log('🔒 TLS: enabled (mongodb+srv default)');
    } else if (isProd) {
      console.log('🔒 TLS: enforced via explicit option');
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', (error as Error).message);
    process.exit(1);
  }
};

// Graceful shutdown
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('👋 MongoDB connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};

export default connectDB;
