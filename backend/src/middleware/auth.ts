import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/jwt';
import { unauthorized, forbidden } from '../lib/errors';
import { prisma } from '../db';

export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: 'MEMBER' | 'ADMIN' | 'PLATFORM_ADMIN';
  tenantId?: string | null;
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(unauthorized('Falta el token de acceso'));
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    req.tenantId = payload.tenantId;
    next();
  } catch {
    next(unauthorized('Token inválido o caducado'));
  }
}

export function requireAdmin(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMIN') return next(forbidden('Solo el administrador puede hacer esto'));
  next();
}

/** The vendor's own operators — manage tenants, not members or franjas. */
export function requirePlatformAdmin(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (req.userRole !== 'PLATFORM_ADMIN') return next(forbidden('Solo el equipo de la plataforma puede hacer esto'));
  next();
}

/** Loads the full ACTIVE member behind the token; used by member-only routes
 *  so a pending/rejected account can't call booking endpoints even with a
 *  valid token. Every member/admin route is tenant-scoped by construction —
 *  the token's tenantId is what every downstream query filters on, never a
 *  value trusted from the request body. */
export async function requireActiveMember(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (!req.tenantId) return next(forbidden('Esta cuenta no pertenece a ningún estudio'));
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return next(unauthorized('Cuenta no encontrada'));
  if (user.status !== 'ACTIVE') return next(forbidden('Tu acceso todavía no está aprobado'));
  next();
}
