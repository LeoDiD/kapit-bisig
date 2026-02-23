/**
 * Zod schemas for Distribution routes (/api/distributions)
 */

import { z } from 'zod';
import { barangayEnum, objectId } from './shared';

/* POST /api/distributions — create */
export const createDistributionBody = z.object({
  barangay: barangayEnum,
  assignedBarangays: z.array(barangayEnum)
    .min(2, 'Select at least 2 assigned barangays')
    .max(4, 'Select up to 4 assigned barangays'),
  scheduled: z.string().min(1, 'Scheduled date is required').max(50),
  households: z.union([
    z.number().int().min(1, 'Households must be >= 1'),
    z.string().transform((v) => {
      const n = parseInt(v, 10);
      if (isNaN(n) || n < 1) throw new Error('Households must be a number >= 1');
      return n;
    }),
  ]),
  notes: z.string().max(2000).optional().default(''),
}).strict().superRefine((data, ctx) => {
  const unique = new Set(data.assignedBarangays);
  if (unique.size !== data.assignedBarangays.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['assignedBarangays'],
      message: 'Assigned barangays must be unique',
    });
  }

  if (data.assignedBarangays.includes(data.barangay)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['assignedBarangays'],
      message: 'Host barangay cannot also be an assigned barangay',
    });
  }
});

/* PATCH /api/distributions/:id/claim */
export const distributionIdParams = z.object({
  id: objectId,
}).strict();

/* GET /api/distributions/:id/households */
// reuses distributionIdParams
