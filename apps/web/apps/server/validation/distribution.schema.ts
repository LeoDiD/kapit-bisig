/**
 * Zod schemas for Distribution routes (/api/distributions)
 */

import { z } from 'zod';
import { barangayEnum, objectId } from './shared';

/* POST /api/distributions — create */
export const createDistributionBody = z.object({
  disasterEventId: objectId,
  barangay: barangayEnum,
  assignedBarangays: z.array(barangayEnum)
    .min(2, 'Select at least 2 assigned barangays')
    .max(4, 'Select up to 4 assigned barangays'),
  scheduled: z.string().min(1, 'Scheduled date is required').max(50),
  assignedStaffIds: z.array(objectId)
    .min(1, 'Select at least 1 staff member'),
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

  if (new Set(data.assignedStaffIds).size !== data.assignedStaffIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['assignedStaffIds'],
      message: 'Assigned staff must be unique',
    });
  }

  const scheduledAt = new Date(data.scheduled);
  const minAllowed = Date.now() + 5 * 60 * 1000;
  if (Number.isNaN(scheduledAt.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scheduled'],
      message: 'Scheduled date/time is invalid',
    });
  } else if (scheduledAt.getTime() < minAllowed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scheduled'],
      message: 'Scheduled date/time must be at least 5 minutes from now',
    });
  }
});

/* PATCH /api/distributions/:id/claim */
export const distributionIdParams = z.object({
  id: objectId,
}).strict();

/* GET /api/distributions/:id/households */
// reuses distributionIdParams
