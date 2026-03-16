import { z } from 'zod';

const trimmedString = z.string().trim();

export const unifiedLoginSchema = z
  .object({
    username: trimmedString.min(3).max(60),
    password: z.string().min(1).max(128),
    rememberMe: z.boolean().optional(),
  })
  .strict();

export const superadminLoginSchema = z
  .object({
    username: trimmedString.min(3).max(60),
    password: z.string().min(1).max(128),
    rememberMe: z.boolean().optional(),
  })
  .strict();

export const householdLoginSchema = z
  .object({
    mobileNumber: trimmedString.min(1).max(32),
    password: z.string().min(1).max(128),
  })
  .strict();

export const householdForgotSendOtpSchema = z
  .object({
    email: trimmedString.email().max(254),
  })
  .strict();

export const householdForgotVerifyOtpSchema = z
  .object({
    email: trimmedString.email().max(254),
    otp: z.string().length(6).regex(/^\d{6}$/),
  })
  .strict();

export const householdForgotResetSchema = z
  .object({
    resetToken: z.string().min(1),
    newPassword: z.string().min(1).max(200),
  })
  .strict();

export const userRegisterSchema = z
  .object({
    email: trimmedString.email().max(254),
    password: z.string().min(8).max(128),
    firstName: trimmedString.min(1).max(50),
    lastName: trimmedString.min(1).max(50),
  })
  .strict();

export const userLoginSchema = z
  .object({
    email: trimmedString.email().max(254),
    password: z.string().min(1).max(128),
  })
  .strict();
