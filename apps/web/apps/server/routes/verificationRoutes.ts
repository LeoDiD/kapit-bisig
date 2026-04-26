import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBase64Image } from '../validation/imageValidation';
import {
  normalizeIdNumber,
  validateIdNumberFormat,
  validateIdType,
} from '../utils/idVerification';
import { screenSubmittedId } from '../services/idScreeningService';
import { performOCRFromBase64Image } from '../services/ocrService';

const router = Router();

const ocrBodySchema = z.object({
  image: z.string().min(1, 'Image is required'),
  language: z.string().optional(),
});

const idCheckBodySchema = z.object({
  idType: z.string().min(1, 'ID type is required'),
  idNumber: z.string().min(1, 'ID number is required'),
  frontIdImage: z.string().min(1, 'Front ID image is required'),
  backIdImage: z.string().min(1, 'Back ID image is required'),
});

function toDataUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('data:image')) {
    return trimmed;
  }
  return `data:image/jpeg;base64,${trimmed}`;
}

router.post('/ocr', async (req: Request, res: Response) => {
  const parsed = ocrBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      text: '',
      confidence: 0,
      blocks: [],
      error: parsed.error.issues[0]?.message || 'Invalid OCR payload',
      errorCode: 'OCR_INVALID_PAYLOAD',
    });
  }

  const image = toDataUrl(parsed.data.image);
  const language = (parsed.data.language || 'eng').trim() || 'eng';

  const imageValidation = await validateBase64Image(image, {
    fieldName: 'OCR image',
    maxBytes: 4 * 1024 * 1024,
    minWidth: 160,
    minHeight: 80,
    maxWidth: 5000,
    maxHeight: 5000,
  });

  if (!imageValidation.ok) {
    return res.status(400).json({
      success: false,
      text: '',
      confidence: 0,
      blocks: [],
      error: imageValidation.message,
      errorCode: 'OCR_IMAGE_INVALID',
    });
  }

  try {
    const result = await performOCRFromBase64Image(image, language);

    return res.json({
      success: true,
      text: result.text,
      confidence: result.confidence,
      blocks: result.blocks,
      languageUsed: result.languageUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      text: '',
      confidence: 0,
      blocks: [],
      error: error instanceof Error ? error.message : 'OCR failed',
      errorCode: 'OCR_PROCESSING_FAILED',
    });
  }
});

router.post('/id-check', async (req: Request, res: Response) => {
  const parsed = idCheckBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message || 'Invalid ID screening payload',
      errorCode: 'ID_SCREENING_INVALID_PAYLOAD',
    });
  }

  const { idType, idNumber, frontIdImage, backIdImage } = parsed.data;
  const normalizedIdNumber = normalizeIdNumber(idType, idNumber);

  if (!validateIdType(idType)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported ID type selected.',
      errorCode: 'ID_TYPE_UNSUPPORTED',
      field: 'idType',
    });
  }

  if (!validateIdNumberFormat(idType, normalizedIdNumber)) {
    return res.status(400).json({
      success: false,
      message: 'Enter a valid ID number for the selected ID type.',
      errorCode: 'ID_NUMBER_INVALID_FORMAT',
      field: 'idNumber',
    });
  }

  try {
    const screening = await screenSubmittedId({
      idType,
      idNumber: normalizedIdNumber,
      frontIdImage,
      backIdImage,
    });

    return res.json({
      success: true,
      screening,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ID screening failed';
    const normalized = message.toLowerCase();
    const field = normalized.includes('front')
      ? 'frontIdImage'
      : normalized.includes('back')
        ? 'backIdImage'
        : normalized.includes('type')
          ? 'idType'
          : normalized.includes('number')
            ? 'idNumber'
            : undefined;

    return res.status(400).json({
      success: false,
      message,
      errorCode: 'ID_SCREENING_FAILED',
      field,
    });
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'verification',
    ocr: 'ready',
    idCheck: 'ready',
    timestamp: new Date().toISOString(),
  });
});

export default router;
