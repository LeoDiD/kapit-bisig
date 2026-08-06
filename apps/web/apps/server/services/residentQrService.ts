import crypto from 'crypto';

type ResidentQrPayloadV2 = {
  v: 2;
  t: 'resident';
  rid: string;
  qv: number;
  iat: number;
};

export type ParsedResidentQr = {
  residentCode: string;
  qrVersion?: number;
  legacy: boolean;
};

function getSigningSecret(): string {
  const secret = process.env.RESIDENT_QR_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('RESIDENT_QR_SECRET or JWT_SECRET must be at least 32 characters long');
  }
  return secret;
}

function sign(encodedPayload: string): string {
  return crypto.createHmac('sha256', getSigningSecret()).update(encodedPayload).digest('base64url');
}

export function buildResidentQrToken(
  residentCode: string,
  qrVersion = 1,
  issuedAt: Date = new Date(),
): string {
  const payload: ResidentQrPayloadV2 = {
    v: 2,
    t: 'resident',
    rid: residentCode.toUpperCase(),
    qv: Math.max(1, qrVersion),
    iat: Math.floor(issuedAt.getTime() / 1000),
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `KBQR2.${encoded}.${sign(encoded)}`;
}

export function parseResidentQrToken(qrData: string): ParsedResidentQr | null {
  if (!qrData || typeof qrData !== 'string') return null;
  const trimmed = qrData.trim();

  // Retained for authorized staff manual lookup and migration tooling.
  if (/^[A-Z]{2}-\d{4}-\d{6}$/.test(trimmed)) {
    return { residentCode: trimmed, legacy: true };
  }

  if (trimmed.startsWith('KBQR2.')) {
    try {
      const [, encoded, signature] = trimmed.split('.');
      if (!encoded || !signature) return null;
      const expected = sign(encoded);
      const suppliedBuffer = Buffer.from(signature, 'base64url');
      const expectedBuffer = Buffer.from(expected, 'base64url');
      if (
        suppliedBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
      ) return null;

      const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<ResidentQrPayloadV2>;
      if (
        parsed.v !== 2 || parsed.t !== 'resident' ||
        typeof parsed.rid !== 'string' || typeof parsed.qv !== 'number'
      ) return null;

      return {
        residentCode: parsed.rid.toUpperCase(),
        qrVersion: parsed.qv,
        legacy: false,
      };
    } catch {
      return null;
    }
  }

  // Accept already-issued V1 cards while residents migrate to the signed card.
  if (trimmed.startsWith('KBQR1.')) {
    try {
      const parsed = JSON.parse(
        Buffer.from(trimmed.slice('KBQR1.'.length), 'base64url').toString('utf8'),
      ) as { v?: number; t?: string; rid?: string };
      if (parsed.v !== 1 || parsed.t !== 'resident' || typeof parsed.rid !== 'string') return null;
      return { residentCode: parsed.rid.toUpperCase(), legacy: true };
    } catch {
      return null;
    }
  }

  return null;
}
