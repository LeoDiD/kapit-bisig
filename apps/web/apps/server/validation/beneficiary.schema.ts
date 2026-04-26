import { z } from 'zod';
import { objectId, barangayEnum, paginationQuery, trimmedString } from './shared';

export const disasterTypeEnum = z.enum([
  'Typhoon',
  'Flood',
  'Storm Surge',
  'Landslide',
  'Earthquake',
  'Fire',
  'Other',
]);

export const damageTypeEnum = z.enum([
  'Flood',
  'House Damage',
  'Storm Surge',
  'Landslide',
  'Livelihood Loss',
  'Other',
]);

const isoDateTime = z.string().datetime({ offset: true });
const proofPhotoArray = z.array(z.string().min(100).max(6_000_000)).min(3).max(5);

export const createDisasterEventBody = z.object({
  name: trimmedString(3, 200),
  disasterType: disasterTypeEnum,
  description: z.string().trim().max(2000).optional().default(''),
  barangays: z.array(barangayEnum).min(1).max(10),
  eventDate: isoDateTime,
  submissionDeadline: isoDateTime.optional(),
  status: z.enum(['Draft', 'Active', 'Closed']).optional().default('Draft'),
}).strict();

export const listDisasterEventsQuery = paginationQuery.extend({
  status: z.enum(['Draft', 'Active', 'Closed']).optional(),
  barangay: barangayEnum.optional(),
}).strict();

export const disasterEventIdParams = z.object({
  id: objectId,
}).strict();

export const residentProofSubmissionBody = z.object({
  distributionId: objectId.optional(),
  disasterEventId: objectId.optional(),
  damageType: damageTypeEnum,
  description: z.string().trim().min(10).max(2000),
  supportingInfo: z.string().trim().max(2000).optional().default(''),
  dateSubmitted: isoDateTime,
  photoProofs: proofPhotoArray,
  clientGeneratedId: z.string().trim().max(128).optional().default(''),
  deviceId: z.string().trim().max(128).optional().default(''),
}).superRefine((value, ctx) => {
  if (!value.distributionId && !value.disasterEventId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['distributionId'],
      message: 'Either distributionId or disasterEventId is required.',
    });
  }
  if (value.distributionId && value.disasterEventId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['distributionId'],
      message: 'Provide either distributionId or disasterEventId, not both.',
    });
  }
}).strict();

export const proofSubmissionListQuery = paginationQuery.extend({
  distributionId: objectId.optional(),
  disasterEventId: objectId.optional(),
  residentId: objectId.optional(),
  status: z.enum(['Pending Verification', 'Approved', 'Rejected']).optional(),
  barangay: barangayEnum.optional(),
  search: z.string().trim().max(120).optional(),
}).strict();

export const proofSubmissionIdParams = z.object({
  id: objectId,
}).strict();

export const proofSubmissionReviewBody = z.object({
  decision: z.enum(['Approved', 'Rejected']),
  rejectionReason: z.string().trim().max(1000).optional(),
}).superRefine((value, ctx) => {
  if (value.decision === 'Rejected' && !value.rejectionReason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rejectionReason'],
      message: 'Rejection reason is required when rejecting a proof submission.',
    });
  }
}).strict();

export const qrValidationBody = z.object({
  qrData: z.string().trim().min(1).max(512),
  disasterEventId: objectId.optional(),
}).strict();

export const beneficiaryClaimBody = z.object({
  qrData: z.string().trim().min(1).max(512).optional(),
  residentId: objectId.optional(),
  disasterEventId: objectId.optional(),
  scannedAt: isoDateTime.optional(),
  clientGeneratedId: z.string().trim().max(128).optional().default(''),
  deviceId: z.string().trim().max(128).optional().default(''),
}).superRefine((value, ctx) => {
  if (!value.qrData && !value.residentId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['qrData'],
      message: 'Either qrData or residentId is required.',
    });
  }
}).strict();

export const offlineProofSyncBody = z.object({
  deviceId: z.string().trim().min(1).max(128),
  submissions: z.array(z.object({
    clientGeneratedId: z.string().trim().min(1).max(128),
    distributionId: objectId.optional(),
    disasterEventId: objectId.optional(),
    damageType: damageTypeEnum,
    description: z.string().trim().min(10).max(2000),
    supportingInfo: z.string().trim().max(2000).optional().default(''),
    dateSubmitted: isoDateTime,
    photoProofs: proofPhotoArray,
  }).superRefine((value, ctx) => {
    if (!value.distributionId && !value.disasterEventId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['distributionId'],
        message: 'Either distributionId or disasterEventId is required.',
      });
    }
    if (value.distributionId && value.disasterEventId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['distributionId'],
        message: 'Provide either distributionId or disasterEventId, not both.',
      });
    }
  }).strict()).min(1).max(20),
}).strict();

export const offlineClaimSyncBody = z.object({
  deviceId: z.string().trim().min(1).max(128),
  disasterEventId: objectId,
  claims: z.array(z.object({
    clientGeneratedId: z.string().trim().min(1).max(128),
    qrData: z.string().trim().min(1).max(512).optional(),
    residentId: objectId.optional(),
    scannedAt: isoDateTime,
  }).superRefine((value, ctx) => {
    if (!value.qrData && !value.residentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['qrData'],
        message: 'Either qrData or residentId is required.',
      });
    }
  }).strict()).min(1).max(100),
}).strict();
