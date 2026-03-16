/**
 * Zod schemas for User CRUD routes (/api/users)
 */

import { z } from 'zod';
import { email, objectId, passwordString, searchString, trimmedString, phoneNumber, paginationQuery } from './shared';

const userRole = z.enum(['Admin', 'Staff', 'Volunteer']);
const userStatus = z.enum(['Active', 'Inactive', 'Suspended']);

/* POST /api/users — create user */
export const createUserBody = z.object({
  email,
  password: passwordString,
  firstName: trimmedString(1, 100),
  lastName: trimmedString(1, 100),
  role: userRole,
  barangay: z.string().trim().max(100).optional(),
  phoneNumber: phoneNumber.optional(),
  status: userStatus.optional().default('Active'),
}).strict();

/* GET /api/users — list */
export const listUsersQuery = paginationQuery.extend({
  role: z.enum(['Admin', 'Staff', 'Volunteer']).optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended']).optional(),
  search: searchString.optional(),
}).strict();

/* GET /api/users/:id */
export const userIdParams = z.object({
  id: objectId,
}).strict();

/* PUT /api/users/:id — update */
export const updateUserBody = z.object({
  firstName: trimmedString(1, 100).optional(),
  lastName: trimmedString(1, 100).optional(),
  role: userRole.optional(),
  barangay: z.string().trim().max(100).optional().nullable(),
  phoneNumber: phoneNumber.optional().nullable(),
  status: userStatus.optional(),
}).strict();

/* PATCH /api/users/:id/status */
export const updateStatusBody = z.object({
  status: userStatus,
}).strict();

/* PATCH /api/users/:id/password */
export const resetUserPasswordBody = z.object({
  newPassword: passwordString,
}).strict();
