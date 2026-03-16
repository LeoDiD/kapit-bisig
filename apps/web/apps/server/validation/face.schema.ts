/**
 * Zod schemas for Face routes (/api/face)
 */

import { z } from 'zod';

/* POST /api/face/detect */
export const faceDetectBody = z.object({
  image: z.string().min(1, 'Image is required').max(3_000_000, 'Image payload is too large'),
}).strict();

/* POST /api/face/compare */
export const faceCompareBody = z.object({
  image1: z.string().min(1, 'image1 is required').max(3_000_000, 'image1 payload is too large'),
  image2: z.string().min(1, 'image2 is required').max(3_000_000, 'image2 payload is too large'),
}).strict();

/* POST /api/face/descriptor */
export const faceDescriptorBody = z.object({
  image: z.string().min(1, 'Image is required').max(3_000_000, 'Image payload is too large'),
}).strict();

/* POST /api/face/verify */
export const faceVerifyBody = z.object({
  image: z.string().min(1, 'Image is required').max(3_000_000, 'Image payload is too large'),
  descriptor: z.array(z.number()).length(128, 'Descriptor must contain exactly 128 values'),
}).strict();

/* POST /api/face/check-duplicate */
export const faceCheckDuplicateBody = z.object({
  image: z.string().min(1, 'Image is required').max(3_000_000, 'Image payload is too large'),
}).strict();
