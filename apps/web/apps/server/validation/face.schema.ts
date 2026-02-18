/**
 * Zod schemas for Face routes (/api/face)
 */

import { z } from 'zod';

/* POST /api/face/detect */
export const faceDetectBody = z.object({
  image: z.string().min(1, 'Image is required'),
}).strict();

/* POST /api/face/compare */
export const faceCompareBody = z.object({
  image1: z.string().min(1, 'image1 is required'),
  image2: z.string().min(1, 'image2 is required'),
}).strict();

/* POST /api/face/descriptor */
export const faceDescriptorBody = z.object({
  image: z.string().min(1, 'Image is required'),
}).strict();

/* POST /api/face/verify */
export const faceVerifyBody = z.object({
  image: z.string().min(1, 'Image is required'),
  descriptor: z.array(z.number()).min(1, 'Descriptor is required'),
}).strict();

/* POST /api/face/check-duplicate */
export const faceCheckDuplicateBody = z.object({
  image: z.string().min(1, 'Image is required'),
}).strict();
