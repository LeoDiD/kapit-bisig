import { createWorker, PSM } from 'tesseract.js';

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

function normalizeLanguage(language?: string): string {
  const value = String(language || 'eng').trim();
  if (!value) return 'eng';
  return value === 'eng+fil' ? 'eng' : value;
}

function stripDataUrlPrefix(input: string): string {
  const marker = 'base64,';
  const index = input.indexOf(marker);
  if (index === -1) return input;
  return input.slice(index + marker.length);
}

async function getWorker(language: string): Promise<OcrWorker> {
  const normalizedLanguage = normalizeLanguage(language);
  const existing = workerPromises.get(normalizedLanguage);
  if (existing) {
    return existing;
  }

  const workerPromise = (async () => {
    const worker = await createWorker(normalizedLanguage);
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
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
  const buffer = Buffer.from(payload, 'base64');
  const worker = await getWorker(normalizedLanguage);
  const result = await worker.recognize(buffer);
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
