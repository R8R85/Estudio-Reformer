import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface TokenPayload {
  sub: string; // user id
  role: 'MEMBER' | 'ADMIN' | 'PLATFORM_ADMIN';
  // Null only for PLATFORM_ADMIN — the vendor's own operators aren't scoped
  // to a studio.
  tenantId: string | null;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}
