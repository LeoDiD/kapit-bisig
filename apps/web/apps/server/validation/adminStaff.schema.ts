/**
 * Zod schemas for Admin Staff routes (/api/admin/users)
 */

import { z } from 'zod';
import { BARANGAY_VALUES, barangayEnum, objectId, trimmedString } from './shared';

/* POST /api/admin/users — create staff */
export const createStaffBody = z.object({
  username: trimmedString(3, 64),
  fullName: trimmedString(2, 100),
  email: z.string().trim().toLowerCase().email('Invalid email format').max(255),
  assignedBarangays: z
    .array(barangayEnum)
    .min(1, 'At least one barangay is required')
    .max(BARANGAY_VALUES.length),
}).strict();

/* GET /api/admin/users — list staff */
export const listStaffQuery = z.object({
  search: z.string().max(100).optional(),
  barangay: z.string().max(50).optional(),
  status: z.enum(['active', 'inactive']).optional(),
}).strict();

/* PATCH /api/admin/users/:id — update staff */
export const updateStaffBody = z.object({
  fullName: trimmedString(2, 100).optional(),
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
  newPassword: z.string().min(1, 'New password is required').max(200),
}).strict();
