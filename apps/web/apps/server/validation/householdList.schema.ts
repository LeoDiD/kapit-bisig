/**
 * Zod schemas for Household List routes (/api/households)
 */

import { z } from 'zod';

/* GET /api/households */
export const listHouseholdsQuery = z.object({
  search: z.string().max(200).optional(),
  barangay: z.string().max(100).optional(),
  status: z.enum(['Claimed', 'Not Claimed']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
}).strict();
