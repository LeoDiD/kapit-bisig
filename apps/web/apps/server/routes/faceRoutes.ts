/**
 * Face Recognition API Routes
 * Provides endpoints for face detection, comparison, and descriptor generation
 */

import express, { Request, Response, Router } from 'express';
import { faceRecognitionService } from '../services/faceRecognitionService';
import { checkDuplicateFace } from '../services/duplicateFaceService';

const router: Router = express.Router();

/**
 * POST /api/face/detect
 * Detect face in an image
 */
router.post('/detect', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image is required (base64 string)',
      });
    }

    const result = await faceRecognitionService.detectFace(image);

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
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const { image1, image2 } = req.body;

    if (!image1 || !image2) {
      return res.status(400).json({
        success: false,
        message: 'Both image1 and image2 are required (base64 strings)',
      });
    }

    const result = await faceRecognitionService.compareFaces(image1, image2);

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
router.post('/descriptor', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image is required (base64 string)',
      });
    }

    const result = await faceRecognitionService.generateDescriptor(image);

    if (!result) {
      return res.status(400).json({
        success: false,
        message: 'No face detected in the image',
      });
    }

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
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { image, descriptor } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image is required (base64 string)',
      });
    }

    if (!descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({
        success: false,
        message: 'Descriptor is required (array of numbers)',
      });
    }

    const result = await faceRecognitionService.compareWithDescriptor(image, descriptor);

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
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Try to initialize the service
    await faceRecognitionService.initialize();
    
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
router.post('/check-duplicate', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image is required (base64 string)',
      });
    }

    const result = await checkDuplicateFace(image);

    if (result.isDuplicate) {
      // Duplicate found - registration should be blocked
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: 'This face is already registered in the system',
        existingResident: result.matchedResident,
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
