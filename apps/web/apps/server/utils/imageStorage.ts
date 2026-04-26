import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const VERIFICATION_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const VERIFICATION_IMAGE_PUBLIC_BASE_PATH = '/uploads/resident-verification';

const UPLOAD_DIR = path.resolve(__dirname, '../../public', VERIFICATION_IMAGE_PUBLIC_BASE_PATH.replace(/^\/uploads\//, 'uploads/'));

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function parseDataUrl(input: string): { mime: string; base64: string } | null {
  const match = input.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], base64: match[2] };
}

function getExtFromMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '.jpg';
  }
}

/**
 * Persist base64 data-url images and return a static URL path.
 * If value is already a non-base64 reference, it is returned unchanged.
 */
export function persistVerificationImage(value: string, prefix: string): string {
  const raw = String(value || '').trim();
  const parsed = parseDataUrl(raw);
  if (!parsed) {
    return raw;
  }

  ensureUploadDir();

  const ext = getExtFromMime(parsed.mime);
  const fileName = `${prefix}-${Date.now()}-${crypto.randomUUID()}${ext}`;
  const absPath = path.join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(parsed.base64, 'base64');
  if (buffer.length > VERIFICATION_IMAGE_MAX_BYTES) {
    throw new Error(`Verification image exceeds the maximum size of ${Math.floor(VERIFICATION_IMAGE_MAX_BYTES / (1024 * 1024))}MB.`);
  }
  fs.writeFileSync(absPath, buffer);

  return `${VERIFICATION_IMAGE_PUBLIC_BASE_PATH}/${fileName}`;
}
