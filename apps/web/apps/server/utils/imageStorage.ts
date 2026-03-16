import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.resolve(__dirname, '../../public/uploads/resident-verification');

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
  fs.writeFileSync(absPath, buffer);

  return `/uploads/resident-verification/${fileName}`;
}
