import { z } from 'zod';
import { barangayEnum } from './shared';

const parseAssignedBarangays = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => String(entry).split(','))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}, z.array(barangayEnum).optional().default([]));

export const scanEligibleUsersQuery = z.object({
  barangay: barangayEnum.optional(),
  hostBarangayId: barangayEnum.optional(),
  assignedBarangayIds: parseAssignedBarangays,
  scheduled: z.string().optional(),
  q: z.string().trim().max(64, 'Search query is too long').optional().default(''),
  limit: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return 20;
      const parsed = Number.parseInt(value, 10);
      if (Number.isNaN(parsed)) return 20;
      return Math.min(50, Math.max(1, parsed));
    }),
  cursor: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return 0;
      const parsed = Number.parseInt(value, 10);
      if (Number.isNaN(parsed)) return 0;
      return Math.max(0, parsed);
    }),
}).passthrough().superRefine((data, ctx) => {
  const targetBarangay = data.barangay || data.hostBarangayId;
  if (!targetBarangay && (!data.assignedBarangayIds || data.assignedBarangayIds.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['barangay'],
      message: 'At least one target barangay is required',
    });
  }

  if (data.assignedBarangayIds && data.assignedBarangayIds.length > 0) {
    const uniqueAssigned = new Set(data.assignedBarangayIds);
    if (uniqueAssigned.size !== data.assignedBarangayIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['assignedBarangayIds'],
        message: 'Assigned barangays must be unique',
      });
    }
  }
});

