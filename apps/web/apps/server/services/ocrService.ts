import { createWorker, PSM } from 'tesseract.js';
import sharp from 'sharp';

export interface OCRWordBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRServiceResult {
  text: string;
  confidence: number;
  blocks: OCRWordBlock[];
  languageUsed: string;
}

type OcrWorker = Awaited<ReturnType<typeof createWorker>>;

const workerPromises = new Map<string, Promise<OcrWorker>>();

/**
 * Normalize language string for Tesseract.
 *
 * Previously this converted 'eng+fil' → 'eng', silently dropping Filipino
 * support. Philippine IDs contain Filipino words ("REPUBLIKA NG PILIPINAS",
 * "PANGALAN", etc.) so keeping 'fil' is important for keyword recognition.
 *
 * If the 'fil' trained data is not available Tesseract will fall back to 'eng'
 * automatically, so there's no harm in requesting it.
 */
function normalizeLanguage(language?: string): string {
  const value = String(language || 'eng').trim();
  if (!value) return 'eng';
  return value;
}

function stripDataUrlPrefix(input: string): string {
  const marker = 'base64,';
  const index = input.indexOf(marker);
  if (index === -1) return input;
  return input.slice(index + marker.length);
}

/**
 * Pre-process the raw image buffer for significantly better OCR accuracy.
 *
 * Mobile phone photos of IDs typically have:
 *  - Colored/patterned backgrounds that confuse character segmentation
 *  - Uneven lighting and shadows
 *  - JPEG compression blur
 *  - Glare and reflections
 *
 * This pipeline addresses each of those problems.
 */
async function preprocessImageForOCR(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      // 1. Convert to grayscale — removes background color/pattern noise
      .grayscale()
      // 2. Auto-normalize contrast — handles uneven lighting
      .normalize()
      // 3. Sharpen to counteract JPEG compression blur
      .sharpen({ sigma: 1.2 })
      // 4. Ensure minimum DPI for Tesseract accuracy (at least ~2000px wide)
      //    without enlarging small images that would only amplify noise
      .resize({
        width: 2400,
        height: 2400,
        fit: 'inside',
        withoutEnlargement: true,
      })
      // 5. Output as lossless PNG to avoid re-introducing JPEG artifacts
      .png()
      .toBuffer();
  } catch (err) {
    // If sharp fails (corrupt image, unsupported format), return the original
    // buffer so Tesseract can still attempt recognition.
    console.warn('[ocrService] Image pre-processing failed, using raw image:', err);
    return buffer;
  }
}

async function getWorker(language: string): Promise<OcrWorker> {
  const normalizedLanguage = normalizeLanguage(language);
  const existing = workerPromises.get(normalizedLanguage);
  if (existing) {
    return existing;
  }

  const workerPromise = (async () => {
    let worker: OcrWorker;

    try {
      worker = await createWorker(normalizedLanguage);
    } catch (err) {
      // If the requested language pack (e.g. 'eng+fil') is unavailable,
      // fall back to English-only.
      if (normalizedLanguage !== 'eng') {
        console.warn(
          `[ocrService] Failed to create worker for '${normalizedLanguage}', falling back to 'eng':`,
          err,
        );
        worker = await createWorker('eng');
      } else {
        throw err;
      }
    }

    // Tuned for ID card recognition:
    // - SINGLE_BLOCK works better for structured ID card layouts than AUTO
    // - Character whitelist prevents garbage from decorative backgrounds
    // - Preserving interword spaces helps pattern matching for ID numbers
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      tessedit_char_whitelist:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/-.:,() ',
      preserve_interword_spaces: '1',
    });

    return worker;
  })();

  workerPromises.set(normalizedLanguage, workerPromise);
  return workerPromise;
}

export async function performOCRFromBase64Image(
  image: string,
  language = 'eng',
): Promise<OCRServiceResult> {
  const normalizedLanguage = normalizeLanguage(language);
  const payload = stripDataUrlPrefix(String(image || '').trim());
  const rawBuffer = Buffer.from(payload, 'base64');

  // Pre-process the image for significantly better OCR accuracy
  const processedBuffer = await preprocessImageForOCR(rawBuffer);

  const worker = await getWorker(normalizedLanguage);
  const result = await worker.recognize(processedBuffer);
  const data = result.data;

  return {
    text: String(data.text || '').trim(),
    confidence: Number(data.confidence || 0) / 100,
    blocks: (data.words || []).map((word) => ({
      text: word.text || '',
      confidence: Number(word.confidence || 0) / 100,
      boundingBox: {
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: Math.max(0, word.bbox.x1 - word.bbox.x0),
        height: Math.max(0, word.bbox.y1 - word.bbox.y0),
      },
    })),
    languageUsed: normalizedLanguage,
  };
}
