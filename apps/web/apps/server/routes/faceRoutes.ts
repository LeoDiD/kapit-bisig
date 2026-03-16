/**
 * Face Recognition API Routes
 * Provides endpoints for face detection, comparison, and descriptor generation
 */

import express, { Request, Response, Router } from 'express';
import { faceRecognitionService } from '../services/faceRecognitionService';
import { checkDuplicateFace } from '../services/duplicateFaceService';
import { requireAuth, requireStaffOrSuperadmin, AuthRequest } from '../middleware/unifiedAuth';
import { logAudit } from '../utils/audit';
import { validateBase64Image } from '../validation/imageValidation';
import { validateRequest } from '../validation/validateRequest';
import {
  faceDetectBody,
  faceCompareBody,
  faceDescriptorBody,
  faceVerifyBody,
  faceCheckDuplicateBody,
} from '../validation/face.schema';

const router: Router = express.Router();
const FACE_PAYLOAD_MAX_BYTES = 4 * 1024 * 1024; // 4MB for JSON body

router.use(requireAuth, requireStaffOrSuperadmin);

/**
 * POST /api/face/detect
 * Detect face in an image
 */
router.post('/detect', validateRequest({ body: faceDetectBody }), async (req: AuthRequest, res: Response) => {
  try {
    const payloadBytes = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
    if (payloadBytes > FACE_PAYLOAD_MAX_BYTES) {
      return res.status(413).json({ success: false, message: 'Request payload too large.' });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image is required (base64 string)',
      });
    }

    const imageValidation = await validateBase64Image(image, {
      fieldName: 'Image',
      maxBytes: 2 * 1024 * 1024,
      minWidth: 80,
      minHeight: 80,
      maxWidth: 4096,
      maxHeight: 4096,
    });
    if (!imageValidation.ok) {
      return res.status(400).json({ success: false, message: imageValidation.message });
    }

    const result = await faceRecognitionService.detectFace(image);
    await logAudit(req, 'FACE_DETECT', 'Face', '', { success: true });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[FaceAPI] Detection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Face detection failed',
    });
  }
});

/**
 * POST /api/face/compare
 * Compare two face images
 */
router.post('/compare', validateRequest({ body: faceCompareBody }), async (req: AuthRequest, res: Response) => {
  try {
    const payloadBytes = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
    if (payloadBytes > FACE_PAYLOAD_MAX_BYTES) {
      return res.status(413).json({ success: false, message: 'Request payload too large.' });
    }

    const { image1, image2 } = req.body;

    if (!image1 || !image2) {
      return res.status(400).json({
        success: false,
        message: 'Both image1 and image2 are required (base64 strings)',
      });
    }

    const [image1Validation, image2Validation] = await Promise.all([
      validateBase64Image(image1, {
        fieldName: 'image1',
        maxBytes: 2 * 1024 * 1024,
        minWidth: 80,
        minHeight: 80,
        maxWidth: 4096,
        maxHeight: 4096,
      }),
      validateBase64Image(image2, {
        fieldName: 'image2',
        maxBytes: 2 * 1024 * 1024,
        minWidth: 80,
        minHeight: 80,
        maxWidth: 4096,
        maxHeight: 4096,
      }),
    ]);
    const failedValidation = [image1Validation, image2Validation].find((v) => !v.ok);
    if (failedValidation && !failedValidation.ok) {
      return res.status(400).json({ success: false, message: failedValidation.message });
    }

    const result = await faceRecognitionService.compareFaces(image1, image2);
    await logAudit(req, 'FACE_COMPARE', 'Face', '', { success: true });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[FaceAPI] Comparison error:', error);
    return res.status(500).json({
      success: false,
      message: 'Face comparison failed',
    });
  }
});

/**
 * POST /api/face/descriptor
 * Generate face descriptor for storage
 */
router.post('/descriptor', validateRequest({ body: faceDescriptorBody }), async (req: AuthRequest, res: Response) => {
  try {
    const payloadBytes = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
    if (payloadBytes > FACE_PAYLOAD_MAX_BYTES) {
      return res.status(413).json({ success: false, message: 'Request payload too large.' });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image is required (base64 string)',
      });
    }

    const imageValidation = await validateBase64Image(image, {
      fieldName: 'Image',
      maxBytes: 2 * 1024 * 1024,
      minWidth: 80,
      minHeight: 80,
      maxWidth: 4096,
      maxHeight: 4096,
    });
    if (!imageValidation.ok) {
      return res.status(400).json({ success: false, message: imageValidation.message });
    }

    const result = await faceRecognitionService.generateDescriptor(image);

    if (!result) {
      return res.status(400).json({
        success: false,
        message: 'No face detected in the image',
      });
    }

    await logAudit(req, 'FACE_DESCRIPTOR', 'Face', '', { success: true });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[FaceAPI] Descriptor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Face descriptor generation failed',
    });
  }
});

/**
 * POST /api/face/verify
 * Verify a face against a stored descriptor
 */
router.post('/verify', validateRequest({ body: faceVerifyBody }), async (req: AuthRequest, res: Response) => {
  try {
    const payloadBytes = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
    if (payloadBytes > FACE_PAYLOAD_MAX_BYTES) {
      return res.status(413).json({ success: false, message: 'Request payload too large.' });
    }

    const { image, descriptor } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image is required (base64 string)',
      });
    }

    const imageValidation = await validateBase64Image(image, {
      fieldName: 'Image',
      maxBytes: 2 * 1024 * 1024,
      minWidth: 80,
      minHeight: 80,
      maxWidth: 4096,
      maxHeight: 4096,
    });
    if (!imageValidation.ok) {
      return res.status(400).json({ success: false, message: imageValidation.message });
    }

    if (!descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({
        success: false,
        message: 'Descriptor is required (array of numbers)',
      });
    }

    const result = await faceRecognitionService.compareWithDescriptor(image, descriptor);
    await logAudit(req, 'FACE_VERIFY', 'Face', '', { success: true });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[FaceAPI] Verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Face verification failed',
    });
  }
});

/**
 * GET /api/face/health
 * Check if face recognition service is ready
 */
router.get('/health', async (req: AuthRequest, res: Response) => {
  try {
    // Try to initialize the service
    await faceRecognitionService.initialize();
    await logAudit(req, 'FACE_HEALTH_CHECK', 'Face', '', { success: true });
    
    return res.json({
      success: true,
      message: 'Face recognition service is ready',
      modelsLoaded: true,
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Face recognition service not ready',
      modelsLoaded: false,
    });
  }
});

/**
 * POST /api/face/check-duplicate
 * Check if a face already exists in the database
 * This is the main endpoint for duplicate detection during registration
 */
router.post('/check-duplicate', validateRequest({ body: faceCheckDuplicateBody }), async (req: AuthRequest, res: Response) => {
  try {
    const payloadBytes = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
    if (payloadBytes > FACE_PAYLOAD_MAX_BYTES) {
      return res.status(413).json({ success: false, message: 'Request payload too large.' });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image is required (base64 string)',
      });
    }

    const imageValidation = await validateBase64Image(image, {
      fieldName: 'Image',
      maxBytes: 2 * 1024 * 1024,
      minWidth: 80,
      minHeight: 80,
      maxWidth: 4096,
      maxHeight: 4096,
    });
    if (!imageValidation.ok) {
      return res.status(400).json({ success: false, message: imageValidation.message });
    }

    const result = await checkDuplicateFace(image);
    await logAudit(req, 'FACE_DUPLICATE_CHECK', 'Face', '', {
      success: true,
      duplicate: result.isDuplicate,
    });

    if (result.isDuplicate) {
      // Duplicate found - registration should be blocked
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: 'Face already registered',
        similarity: result.similarity,
        distance: result.distance,
        totalCompared: result.totalCompared,
        processingTime: result.processingTime,
      });
    }

    // No duplicate - safe to proceed with registration
    return res.json({
      success: true,
      isDuplicate: false,
      message: 'Face verified - no duplicate found',
      descriptor: result.descriptor,
      closestMatch: result.distance ? {
        distance: result.distance,
        similarity: result.similarity,
      } : null,
      totalCompared: result.totalCompared,
      processingTime: result.processingTime,
    });
  } catch (error) {
    console.error('[FaceAPI] Duplicate check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check for duplicate face',
    });
  }
});

export default router;
