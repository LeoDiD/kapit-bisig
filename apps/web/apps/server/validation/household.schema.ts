/**
 * Zod schemas for Household routes (/api/household)
 */

import { z } from 'zod';
import { barangayEnum, trimmedString } from './shared';

/* POST /api/household/validate-token */
export const validateTokenBody = z.object({
  token: z.string().min(1, 'Token is required').max(50),
  barangay: z.string().max(50).optional(),
}).strict();

/* POST /api/household/register */
export const registerHouseholdBody = z.object({
  firstName: trimmedString(1, 100),
  lastName: trimmedString(1, 100),
  dateOfBirth: z.string().min(1, 'Date of birth is required').max(30),
  gender: z.string().min(1, 'Gender is required').max(30),
  mobileNumber: z.string().min(1, 'Mobile number is required').max(20),
  password: z.string().min(1, 'Password is required').max(200),
  barangay: barangayEnum,
  streetAddress: trimmedString(1, 500),
  householdToken: z.string().min(1, 'Household token is required').max(50),
  // Optional fields
  city: z.string().max(100).optional(),
  householdSize: z.number().int().min(1).max(50).optional(),
  vulnerableMembers: z.array(z.string().max(50)).optional(),
  vulnerableCounts: z.record(z.string(), z.number()).optional(),
  idType: z.string().max(50).optional(),
  idNumber: z.string().max(100).optional(),
  frontIdImage: z.string().optional(),
  backIdImage: z.string().optional(),
  faceImage: z.string().optional(),
  faceDescriptor: z.array(z.number()).optional(),
  verification: z.any().optional(),
  verificationResult: z.any().optional(),
}); // Not strict — service layer handles extra fields

/* POST /api/household/check-mobile */
export const checkMobileBody = z.object({
  mobileNumber: z.string().max(20).optional(),
}).strict();
