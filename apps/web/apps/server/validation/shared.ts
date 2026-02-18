/**
 * Shared Zod primitives reused across multiple schema files.
 */

import { z } from 'zod';

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

/** Non-empty trimmed string with max length */
export const trimmedString = (min = 1, max = 255) =>
  z.string().trim().min(min).max(max);

/** Email format */
export const email = z.string().trim().toLowerCase().email('Invalid email format').max(255);

/** Philippine phone number */
export const phoneNumber = z
  .string()
  .trim()
  .regex(/^(\+63|0)?[0-9]{10,11}$/, 'Invalid Philippine phone number format');

/** Base64 image string (data URI or raw) */
export const base64Image = z.string().min(100, 'Image data is required');
