/**
 * Zod schemas for Unified Auth routes (/api/auth)
 * [SECURITY CHECKLIST §2.1] All Inputs Validated Server-Side
 * [SECURITY CHECKLIST §2.2] Schema Validation (Zod) — .strict() rejects unknown keys
 */

import { z } from 'zod';
import { email as safeEmail, passwordString, searchString, trimmedString } from './shared';

/* POST /api/auth/login — email-only login */
export const loginBody = z.object({
  email: safeEmail,
  password: passwordString.optional(),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be 6 digits').optional(),
  rememberMe: z.boolean().optional(),
}).strict();

/* POST /api/auth/register  (legacy auth) */
export const registerBody = z.object({
  email: safeEmail,
  password: passwordString,
  firstName: trimmedString(1, 64),
  lastName: trimmedString(1, 64),
}).strict();

/* POST /api/auth/validate-password */
export const validatePasswordBody = z.object({
  password: passwordString,
}).strict();

/* POST /api/sa/login */
export const saLoginBody = z.object({
  username: searchString.min(1, 'Username is required'),
  password: passwordString,
  rememberMe: z.boolean().optional(),
}).strict();

/* ---- Forgot Password schemas ---- */

/* POST /api/auth/forgot-password/send-otp */
export const sendOtpBody = z.object({
  email: safeEmail,
}).strict();

/* POST /api/auth/forgot-password/verify-otp */
export const verifyOtpBody = z.object({
  email: safeEmail,
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be 6 digits'),
}).strict();

/* POST /api/auth/forgot-password/reset */
export const forgotResetPasswordBody = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: passwordString,
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
  newPassword: passwordString,
}).strict();
