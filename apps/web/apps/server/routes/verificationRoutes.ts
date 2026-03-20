import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createWorker, PSM } from 'tesseract.js';
import { validateBase64Image } from '../validation/imageValidation';

const router = Router();

const ocrBodySchema = z.object({
  image: z.string().min(1, 'Image is required'),
  language: z.string().optional(),
});

type OcrWorker = Awaited<ReturnType<typeof createWorker>>;
let workerPromise: Promise<OcrWorker> | null = null;

async function getWorker(language: string): Promise<OcrWorker> {
  if (workerPromise) {
    return workerPromise;
  }

  workerPromise = (async () => {
    const worker = await createWorker(language);
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
    });
    return worker;
  })();

  return workerPromise;
}

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
    const base64Payload = image.slice(image.indexOf('base64,') + 'base64,'.length);
    const buffer = Buffer.from(base64Payload, 'base64');
    const worker = await getWorker(language === 'eng+fil' ? 'eng' : language);
    const result = await worker.recognize(buffer);
    const data = result.data;

    const blocks = (data.words || []).map((word) => ({
      text: word.text || '',
      confidence: Number(word.confidence || 0) / 100,
      boundingBox: {
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: Math.max(0, word.bbox.x1 - word.bbox.x0),
        height: Math.max(0, word.bbox.y1 - word.bbox.y0),
      },
    }));

    return res.json({
      success: true,
      text: String(data.text || '').trim(),
      confidence: Number(data.confidence || 0) / 100,
      blocks,
      languageUsed: language === 'eng+fil' ? 'eng' : language,
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

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'verification',
    ocr: 'ready',
    timestamp: new Date().toISOString(),
  });
});

export default router;
