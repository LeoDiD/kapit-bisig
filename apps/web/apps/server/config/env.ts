/// <reference types="node" />

/**
 * Centralized Environment Configuration
 *
 * Validates required env vars at startup using Zod.
 * If validation fails, the server exits immediately.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z
    .string()
    .default('3001')
    .transform((v) => parseInt(v, 10)),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // MongoDB
  MONGODB_URI: z
    .string({ message: 'MONGODB_URI is required' })
    .min(1, 'MONGODB_URI must not be empty'),

  // JWT
  JWT_SECRET: z
    .string({ message: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters'),

  // CORS
  CORS_ORIGIN: z.string().default('http://192.168.1.72:3000'),

  // Superadmin (env-based account)
  SUPERADMIN_USERNAME: z
    .string({ message: 'SUPERADMIN_USERNAME is required' })
    .min(1, 'SUPERADMIN_USERNAME must not be empty'),
  SUPERADMIN_PASSWORD_HASH: z
    .string({ message: 'SUPERADMIN_PASSWORD_HASH is required' })
    .min(1, 'SUPERADMIN_PASSWORD_HASH must not be empty'),

  // Blockchain hash salt
  HASH_SALT: z.string().default('kapit-bisig-salt'),

  // Cookie settings
  COOKIE_NAME: z.string().default('sa_token'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return undefined;
    }),

  // Blockchain (Hardhat / Ganache)
  GANACHE_URL: z.string().optional(),
  CONTRACT_ADDRESS: z.string().optional(),
  DEPLOYER_PRIVATE_KEY: z.string().optional(),

  // Face recognition backend
  FACE_RECOGNITION_API_URL: z.string().optional(),

  // SMTP / Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  APP_NAME: z.string().default('KapitBisig'),
  FRONTEND_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:');
  for (const issue of parsed.error.issues) {
    console.error(` - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const parsedData = parsed.data;

export const env = Object.freeze({
  ...parsedData,
  isProd: parsedData.NODE_ENV === 'production',
  cookieSecure:
    parsedData.COOKIE_SECURE !== undefined
      ? parsedData.COOKIE_SECURE
      : parsedData.NODE_ENV === 'production',
});

export type Env = typeof env;


