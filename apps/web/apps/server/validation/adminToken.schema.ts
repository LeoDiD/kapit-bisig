/**
 * Zod schemas for Admin Token routes (/api/admin/tokens)
 */

import { z } from 'zod';
import { barangayEnum, objectId, trimmedString, paginationQuery } from './shared';

/* POST /generate */
export const generateTokenBody = z.object({
  headOfHousehold: trimmedString(2, 200),
  address: trimmedString(2, 500),
  barangay: barangayEnum,
  expectedMembers: z.number().int().min(1).max(50).optional(),
  notes: z.string().max(1000).optional(),
  validityDays: z.number().int().min(1).max(365).optional(),
}).strict();

/* POST /bulk-generate */
export const bulkGenerateBody = z.object({
  households: z
    .array(
      z.object({
        headOfHousehold: trimmedString(2, 200),
        address: trimmedString(2, 500),
        barangay: barangayEnum,
        expectedMembers: z.number().int().min(1).max(50).optional(),
        notes: z.string().max(1000).optional(),
      }).strict(),
    )
    .min(1, 'At least one household is required')
    .max(50, 'Maximum 50 tokens at once'),
  validityDays: z.number().int().min(1).max(365).optional(),
}).strict();

/* GET /list */
export const listTokensQuery = paginationQuery.extend({
  barangay: z.string().min(1, 'Barangay is required').max(50),
  status: z.enum(['UNUSED', 'LOCKED', 'USED', 'EXPIRED']).optional(),
}).strict();

/* GET / DELETE /:id  &  GET /:id/history */
export const tokenIdParams = z.object({
  id: objectId,
}).strict();

export const tokenHistoryQuery = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const n = v ? parseInt(v, 10) || 50 : 50;
      return Math.min(100, Math.max(1, n));
    }),
}).strict();

/* GET /stats/summary */
export const tokenStatsQuery = z.object({
  barangay: z.string().min(1, 'Barangay is required').max(50),
}).strict();
