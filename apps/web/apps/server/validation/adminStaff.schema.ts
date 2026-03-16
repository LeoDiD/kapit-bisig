/**
 * Zod schemas for Admin Staff routes (/api/admin/users)
 */

import { z } from 'zod';
import { BARANGAY_VALUES, barangayEnum, email, objectId, passwordString, searchString, trimmedString } from './shared';

/* POST /api/admin/users — create staff */
export const createStaffBody = z.object({
  firstName: trimmedString(1, 60),
  lastName: trimmedString(1, 60),
  email,
  assignedBarangays: z
    .array(barangayEnum)
    .min(1, 'At least one barangay is required')
    .max(BARANGAY_VALUES.length),
}).strict();

/* GET /api/admin/users — list staff */
export const listStaffQuery = z.object({
  search: searchString.optional(),
  barangay: trimmedString(1, 50).optional(),
  status: z.enum(['active', 'pending', 'inactive']).optional(),
}).strict();

/* PATCH /api/admin/users/:id — update staff */
export const updateStaffBody = z.object({
  firstName: trimmedString(1, 60).optional(),
  lastName: trimmedString(1, 60).optional(),
  assignedBarangays: z
    .array(barangayEnum)
    .min(1)
    .max(BARANGAY_VALUES.length)
    .optional(),
  isActive: z.boolean().optional(),
}).strict();

export const staffIdParams = z.object({
  id: objectId,
}).strict();

/* PATCH /api/admin/users/:id/reset-password */
export const resetPasswordBody = z.object({
  newPassword: passwordString,
}).strict();
