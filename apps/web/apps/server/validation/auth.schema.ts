/**
 * Zod schemas for Unified Auth routes (/api/auth)
 * [SECURITY CHECKLIST §2.1] All Inputs Validated Server-Side
 * [SECURITY CHECKLIST §2.2] Schema Validation (Zod) — .strict() rejects unknown keys
 */

import { z } from 'zod';

/* POST /api/auth/login — accepts username OR email as the "username" field */
export const loginBody = z.object({
  username: z.string().trim().min(1, 'Username or email is required').max(255),
  password: z.string().min(1, 'Password is required').max(200).optional(),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be 6 digits').optional(),
  rememberMe: z.boolean().optional(),
}).strict();

/* POST /api/auth/register  (legacy auth) */
export const registerBody = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required').max(200),
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
}).strict();

/* POST /api/auth/validate-password */
export const validatePasswordBody = z.object({
  password: z.string().min(1, 'Password is required').max(200),
}).strict();

/* POST /api/sa/login */
export const saLoginBody = z.object({
  username: z.string().trim().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(200),
  rememberMe: z.boolean().optional(),
}).strict();

/* ---- Forgot Password schemas ---- */

/* POST /api/auth/forgot-password/send-otp */
export const sendOtpBody = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format').max(255),
}).strict();

/* POST /api/auth/forgot-password/verify-otp */
export const verifyOtpBody = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format').max(255),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be 6 digits'),
}).strict();

/* POST /api/auth/forgot-password/reset */
export const forgotResetPasswordBody = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(1, 'New password is required').max(200),
}).strict();

/* ---- Login OTP Verification schemas ---- */

/* POST /api/auth/login/verify-otp */
export const loginVerifyOtpBody = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be 6 digits'),
}).strict();

/* POST /api/auth/login/resend-otp */
export const loginResendOtpBody = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
}).strict();

/* POST /api/auth/set-password */
export const setPasswordBody = z.object({
  newPassword: z.string().min(1, 'New password is required').max(200),
}).strict();
