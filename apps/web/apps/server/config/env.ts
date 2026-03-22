/**
 * Centralised Environment Configuration
 *
 * [SECURITY CHECKLIST §3.1] Secure Credential Storage (.env)
 *
 * Validates ALL required env vars at startup using Zod.
 * If any required variable is missing the server exits immediately
 * with a clear error message — no silent fallbacks for secrets.
 *
 * Usage:
 *   import { env } from '../config/env';
 *   mongoose.connect(env.MONGODB_URI, { ... });
 *
 * IMPORTANT: `dotenv.config()` must be called BEFORE importing this module
 * (already handled in server/index.ts).
 */

import { z } from 'zod';

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

const envSchema = z.object({
  /* ---- Server ---- */
  PORT: z
    .string()
    .default('3001')
    .transform((v) => parseInt(v, 10)),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  /* ---- MongoDB ---- */
  MONGODB_URI: z
    .string({ message: 'MONGODB_URI is required' })
    .min(1, 'MONGODB_URI must not be empty'),

  /* ---- JWT ---- */
  // [SECURITY CHECKLIST §1.5] JWT_SECRET min 32 chars validated at boot
  JWT_SECRET: z
    .string({ message: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters'),

  /* ---- CORS ---- */
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  /* ---- Superadmin (env-based account) ---- */
  SUPERADMIN_EMAIL: z
    .string({ message: 'SUPERADMIN_EMAIL is required' })
    .email('SUPERADMIN_EMAIL must be a valid email address'),
  SUPERADMIN_PASSWORD_HASH: z
    .string({ message: 'SUPERADMIN_PASSWORD_HASH is required' })
    .min(1, 'SUPERADMIN_PASSWORD_HASH must not be empty'),

  /* ---- Blockchain hash salt ---- */
  HASH_SALT: z.string().default('kapit-bisig-salt'),

  /* ---- Cookie settings (optional, defaults based on NODE_ENV) ---- */
  COOKIE_NAME: z.string().default('sa_token'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return undefined; // will be derived from NODE_ENV
    }),

  /* ---- Face recognition backend ---- */
  FACE_RECOGNITION_API_URL: z.string().optional(),

  /* ---- SMTP / Email (used by forgot-password OTP flow) ---- */
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  APP_NAME: z.string().default('KapitBisig'),
  FRONTEND_URL: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  Parse & export                                                     */
/* ------------------------------------------------------------------ */

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:');
  for (const issue of parsed.error.issues) {
    console.error(` - ${issue.path.join('.')}: ${issue.message}`);
  }
  throw new Error('Invalid environment configuration');
}

const envData = parsed.data;

/**
 * Validated & typed environment object.
 * Access any env variable via `env.VARIABLE_NAME`.
 */
export const env = Object.freeze({
  ...envData,
  /** Whether we are running in production */
  isProd: envData.NODE_ENV === 'production',
  /** Derived cookie secure flag: explicit env wins, else true in prod */
  cookieSecure:
    envData.COOKIE_SECURE !== undefined
      ? envData.COOKIE_SECURE
      : envData.NODE_ENV === 'production',
});

export type Env = typeof env;
