/**
 * Database Connection Module
 *
 * Connects to MongoDB using MONGODB_URI from environment variables.
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const DEFAULT_DB_NAME = 'kapit-bisig';
const MONGODB_DB_NAME = (process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME).trim();

function validateMongoConfig(uri: string): void {
  const isProd = process.env.NODE_ENV === 'production';

  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  if (isProd && !/^mongodb(\+srv)?:\/\//.test(uri)) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string');
  }

  if (isProd && !uri.includes('@')) {
    throw new Error('MongoDB authentication credentials must be included in MONGODB_URI');
  }

  if (isProd && uri.includes('localhost')) {
    throw new Error('Production database cannot use localhost');
  }
}

export const connectDB = async (): Promise<void> => {
  const uri = MONGODB_URI || '';
  validateMongoConfig(uri);

  const isProd = process.env.NODE_ENV === 'production';
  const mongooseDebugFlag = (process.env.MONGOOSE_DEBUG || '').trim().toLowerCase();
  const enableMongooseDebug = !isProd && mongooseDebugFlag === 'true';
  const isSrv = uri.startsWith('mongodb+srv://');
  const forceTLS = process.env.MONGODB_REQUIRE_TLS === 'true' || isProd;

  try {
    mongoose.set('sanitizeFilter', true);
    mongoose.set('strictQuery', true);
    mongoose.set('debug', enableMongooseDebug);

    const options: mongoose.ConnectOptions = {
      dbName: MONGODB_DB_NAME,
      maxPoolSize: 15,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      ...(forceTLS && !isSrv ? { tls: true } : {}),
      tlsAllowInvalidCertificates: false,
      retryWrites: true,
      autoIndex: !isProd,
    };

    const conn = await mongoose.connect(uri, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Mongoose debug logging: ${enableMongooseDebug ? 'enabled' : 'disabled'}`);
    if (isSrv) {
      console.log('TLS: enabled via mongodb+srv');
    } else if (forceTLS) {
      console.log('TLS: enforced via connection options');
    }

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
  } catch (error) {
    console.error('MongoDB connection error:', (error as Error).message);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed gracefully');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

export default connectDB;
