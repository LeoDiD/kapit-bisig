import jwt from 'jsonwebtoken';
import RevokedToken from '../models/RevokedToken';

interface TokenPayload {
  jti?: string;
  exp?: number;
}

export async function revokeJWTByValue(
  token: string,
  tokenType: 'access' | 'session' = 'access'
): Promise<void> {
  const secret = process.env.JWT_SECRET;
  if (!secret || !token) return;

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as TokenPayload;
    if (!decoded.jti || !decoded.exp) return;

    await RevokedToken.updateOne(
      { jti: decoded.jti },
      {
        $setOnInsert: {
          jti: decoded.jti,
          tokenType,
          expiresAt: new Date(decoded.exp * 1000),
          revokedAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch {
    // Ignore invalid/expired token revocation attempts.
  }
}

export async function isJWTRevoked(jti?: string): Promise<boolean> {
  if (!jti) return false;
  const revoked = await RevokedToken.exists({ jti });
  return !!revoked;
}
