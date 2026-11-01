import { prisma } from '../db';
import { getTenantSettings } from './settings';

/** Every ACTIVE user has exactly one Bono row, created (empty, "Sin bono")
 *  the moment their access request is approved. This just guards against
 *  any row that predates that invariant. */
export async function ensureBono(tenantId: string, userId: string) {
  const existing = await prisma.bono.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.bono.create({ data: { tenantId, userId, remaining: 0, cycleLabel: 'Sin bono' } });
}

export async function renewOne(tenantId: string, userId: string) {
  const settings = await getTenantSettings(tenantId);
  await ensureBono(tenantId, userId);
  const [bono] = await prisma.$transaction([
    prisma.bono.update({
      where: { userId },
      data: { remaining: { increment: 8 }, cycleLabel: settings.nextCycleLabel },
    }),
    prisma.bonoRenewal.create({
      data: { tenantId, userId, cycleLabel: settings.nextCycleLabel, sessionsAdded: 8 },
    }),
  ]);
  return bono;
}

/** "Pendiente de renovar" = hasn't been brought current with the studio's
 *  declared next cycle yet — covers both members mid-cycle and brand-new
 *  approvals still sitting on "Sin bono". */
export async function pendingRenewalUsers(tenantId: string) {
  const settings = await getTenantSettings(tenantId);
  return prisma.user.findMany({
    where: { tenantId, status: 'ACTIVE', bono: { cycleLabel: { not: settings.nextCycleLabel } } },
    include: { bono: true },
    orderBy: { name: 'asc' },
  });
}

export async function renewAllPending(tenantId: string) {
  const users = await pendingRenewalUsers(tenantId);
  for (const u of users) await renewOne(tenantId, u.id);
  return users.length;
}

export function bonoStatusLabel(remaining: number): 'Activo' | 'Agotado' {
  return remaining > 0 ? 'Activo' : 'Agotado';
}
