import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { asyncHandler } from '../lib/asyncHandler';
import { validateBody, registerSchema, loginSchema } from '../lib/validate';
import { badRequest, unauthorized } from '../lib/errors';
import { signToken } from '../lib/jwt';
import { requireAuth, AuthedRequest } from '../middleware/auth';

export const authRouter = Router();

function publicUser(u: {
  id: string; name: string; email: string; phone: string; role: string; status: string;
  experienciaPrevia: boolean; patologia: boolean; patologiaTexto: string | null; createdAt: Date;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    experienciaPrevia: u.experienciaPrevia,
    patologia: u.patologia,
    patologiaTexto: u.patologiaTexto ?? '',
    createdAt: u.createdAt,
  };
}

async function findTenantByCode(code: string) {
  const tenant = await prisma.tenant.findUnique({ where: { code } });
  if (!tenant) throw badRequest('No existe ningún estudio con ese código');
  return tenant;
}

// El estudio revisa cada alta: el registro crea la cuenta en PENDING, sin
// bono ni acceso a la agenda, hasta que la administración la apruebe.
authRouter.post('/register', validateBody(registerSchema), asyncHandler(async (req, res) => {
  const { studioCode, name, email, phone, password, experienciaPrevia, patologia, patologiaTexto } = req.body;
  const tenant = await findTenantByCode(studioCode);

  const exists = await prisma.user.findUnique({ where: { tenantId_email: { tenantId: tenant.id, email } } });
  if (exists) throw badRequest('Ya existe una cuenta con ese email en este estudio');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name, email, phone, passwordHash,
      experienciaPrevia, patologia,
      patologiaTexto: patologia ? patologiaTexto : null,
      role: 'MEMBER',
      status: 'PENDING',
    },
  });
  const token = signToken({ sub: user.id, role: 'MEMBER', tenantId: tenant.id });
  res.status(201).json({ token, user: publicUser(user) });
}));

authRouter.post('/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { studioCode, email, password } = req.body;
  const tenant = await findTenantByCode(studioCode);

  const user = await prisma.user.findUnique({ where: { tenantId_email: { tenantId: tenant.id, email } } });
  if (!user) throw unauthorized('Email o contraseña incorrectos');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw unauthorized('Email o contraseña incorrectos');
  if (user.status === 'REJECTED') throw unauthorized('El estudio no aprobó tu acceso');
  const token = signToken({ sub: user.id, role: user.role as 'MEMBER' | 'ADMIN', tenantId: tenant.id });
  res.json({ token, user: publicUser(user) });
}));

authRouter.get('/me', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw unauthorized('Cuenta no encontrada');
  res.json({ user: publicUser(user) });
}));
