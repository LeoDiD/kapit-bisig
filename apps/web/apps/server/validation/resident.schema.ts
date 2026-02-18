/**
 * Zod schemas for Resident routes (/api/residents)
 */

import { z } from 'zod';
import { objectId, trimmedString, barangayEnum } from './shared';

/* POST /api/residents/register */
export const registerResidentBody = z.object({
  firstName: trimmedString(1, 100),
  lastName: trimmedString(1, 100),
  fullName: z.string().max(200).optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required').max(30),
  gender: z.string().min(1, 'Gender is required').max(30),
  mobileNumber: z.string().min(1, 'Mobile number is required').max(20),
  password: z.string().min(1, 'Password is required').max(200),
  // Address
  city: z.string().max(100).optional().default(''),
  barangay: trimmedString(1, 100),
  streetAddress: trimmedString(1, 500),
  householdSize: z.number().int().min(1).max(50).optional().default(1),
  vulnerableMembers: z.array(z.string().max(50)).optional().default([]),
  vulnerableCounts: z.record(z.string(), z.number()).optional().default({}),
  // ID
  idType: z.string().min(1, 'ID type is required').max(50),
  idNumber: z.string().min(1, 'ID number is required').max(100),
  frontIdImage: z.string().min(1, 'Front ID image is required'),
  backIdImage: z.string().min(1, 'Back ID image is required'),
  // Face
  faceImage: z.string().min(1, 'Face image is required'),
  // Verification (from mobile AI)
  verificationResult: z.any().optional(),
}); // Not strict to allow mobile client flexibility

/* GET /api/residents */
export const listResidentsQuery = z.object({
  status: z.string().max(30).optional(),
  barangay: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
}).strict();

/* GET /api/residents/:id */
export const residentIdParams = z.object({
  id: objectId,
}).strict();

/* PATCH /api/residents/:id/verify */
export const verifyResidentBody = z.object({
  status: z.enum(['Approved', 'Rejected']),
  rejectionReason: z.string().max(1000).optional(),
  verifiedBy: z.string().max(200).optional(),
}).strict();
