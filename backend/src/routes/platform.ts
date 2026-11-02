import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { asyncHandler } from '../lib/asyncHandler';
import { conflict, notFound, unauthorized } from '../lib/errors';
import { signToken } from '../lib/jwt';
import { requireAuth, requirePlatformAdmin } from '../middleware/auth';
import { validateBody, platformLoginSchema, tenantCreateSchema, tenantPatchSchema } from '../lib/validate';
import { PLAN_LIMITS } from '../services/billing';

/**
 * The software vendor's own back office: creating/managing the tenants
 * (studios) that run on this one shared app/API, independent of any one
 * studio's own admin panel. PLATFORM_ADMIN accounts are created by hand
 * (e.g. via `npx prisma studio` or the seed script) — there's no public
 * sign-up for this role.
 */
export const platformRouter = Router();

platformRouter.post('/login', validateBody(platformLoginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findFirst({ where: { tenantId: null, role: 'PLATFORM_ADMIN', email } });
  if (!user) throw unauthorized('Email o contraseña incorrectos');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw unauthorized('Email o contraseña incorrectos');
  const token = signToken({ sub: user.id, role: 'PLATFORM_ADMIN', tenantId: null });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}));

platformRouter.use(requireAuth, requirePlatformAdmin);

platformRouter.get('/tenants', asyncHandler(async (_req, res) => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true } } },
  });
  res.json({
    tenants: tenants.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      location: t.location,
      plan: t.plan,
      subscriptionStatus: t.subscriptionStatus,
      planMemberLimit: t.planMemberLimit,
      memberCount: t._count.users,
      suspended: !!t.suspendedAt,
      createdAt: t.createdAt,
    })),
  });
}));

platformRouter.get('/tenants/:id', asyncHandler(async (req, res) => {
  const t = await prisma.tenant.findUnique({ where: { id: req.params.id }, include: { _count: { select: { users: true } } } });
  if (!t) throw notFound('Estudio no encontrado');
  res.json({ tenant: t });
}));

// Creates the tenant row plus its first ADMIN user (ACTIVE immediately —
// unlike a member sign-up, a studio's own first admin doesn't need
// approval from anyone).
platformRouter.post('/tenants', validateBody(tenantCreateSchema), asyncHandler(async (req, res) => {
  const { code, name, location, plan, adminName, adminEmail, adminPhone, adminPassword } = req.body;

  const existingCode = await prisma.tenant.findUnique({ where: { code } });
  if (existingCode) throw conflict('Ya existe un estudio con ese código');

  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.TRIAL;
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const tenant = await prisma.tenant.create({
    data: {
      code, name, location, plan,
      planMemberLimit: limits.memberLimit,
      planWhatsappEnabled: limits.whatsappEnabled,
      planMultiSede: limits.multiSede,
      trialEndsAt: plan === 'TRIAL' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
      users: {
        create: {
          name: adminName, email: adminEmail, phone: adminPhone, passwordHash,
          role: 'ADMIN', status: 'ACTIVE', approvedAt: new Date(),
        },
      },
    },
  });
  res.status(201).json({ tenant });
}));

platformRouter.put('/tenants/:id', validateBody(tenantPatchSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Estudio no encontrado');
  const tenant = await prisma.tenant.update({ where: { id: req.params.id }, data: req.body });
  res.json({ tenant });
}));

platformRouter.post('/tenants/:id/suspend', asyncHandler(async (req, res) => {
  const existing = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Estudio no encontrado');
  const tenant = await prisma.tenant.update({ where: { id: req.params.id }, data: { suspendedAt: new Date() } });
  res.json({ tenant });
}));

platformRouter.post('/tenants/:id/unsuspend', asyncHandler(async (req, res) => {
  const existing = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Estudio no encontrado');
  const tenant = await prisma.tenant.update({ where: { id: req.params.id }, data: { suspendedAt: null } });
  res.json({ tenant });
}));
