/**
 * Shared Zod primitives reused across multiple schema files.
 */

import { z } from 'zod';

const SAFE_ASCII_TEXT = /^[\x20-\x7E]*$/;

/* ------------------------------------------------------------------ */
/*  Barangay enum (single source of truth mirrors Distribution model) */
/* ------------------------------------------------------------------ */
export const BARANGAY_VALUES = [
  'Bolo',
  'Bongalon',
  'Dulig',
  'Laois',
  'Magsaysay',
  'Poblacion',
  'San Gonzalo',
  'San Jose',
  'Tobuan',
  'Uyong',
] as const;

export const barangayEnum = z.enum(BARANGAY_VALUES);

/* ------------------------------------------------------------------ */
/*  Mongo ObjectId string                                              */
/* ------------------------------------------------------------------ */
export const objectId = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format');

/* ------------------------------------------------------------------ */
/*  Pagination query helpers                                           */
/* ------------------------------------------------------------------ */
export const paginationQuery = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Math.max(1, parseInt(v, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const n = v ? parseInt(v, 10) || 20 : 20;
      return Math.min(100, Math.max(1, n));
    }),
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Non-empty trimmed ASCII string with max length (default 64) */
export const trimmedString = (min = 1, max = 64) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((v) => SAFE_ASCII_TEXT.test(v), 'Only standard characters are allowed');

/** Email format */
export const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(64, 'Email must be at most 64 characters')
  .email('Invalid email format')
  .refine((v) => SAFE_ASCII_TEXT.test(v), 'Only standard characters are allowed');

/** Search text (optional) */
export const searchString = z
  .string()
  .trim()
  .max(64, 'Search text must be at most 64 characters')
  .refine((v) => SAFE_ASCII_TEXT.test(v), 'Only standard characters are allowed');

/** Password text (no whitespace, max 64) */
export const passwordString = z
  .string()
  .min(1, 'Password is required')
  .max(64, 'Password must be at most 64 characters')
  .refine((v) => !/\s/.test(v), 'Password must not contain spaces or whitespace')
  .refine((v) => SAFE_ASCII_TEXT.test(v), 'Only standard characters are allowed');

/** Philippine phone number */
export const phoneNumber = z
  .string()
  .trim()
  .regex(/^(\+63|0)?[0-9]{10,11}$/, 'Invalid Philippine phone number format');

/** Base64 image string (data URI or raw) */
export const base64Image = z.string().min(100, 'Image data is required');
