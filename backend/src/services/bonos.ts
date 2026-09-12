import { prisma } from '../db';
import { getSettings } from './settings';

/** Every ACTIVE user has exactly one Bono row, created (empty, "Sin bono")
 *  the moment their access request is approved. This just guards against
 *  any row that predates that invariant. */
export async function ensureBono(userId: string) {
  const existing = await prisma.bono.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.bono.create({ data: { userId, remaining: 0, cycleLabel: 'Sin bono' } });
}

export async function renewOne(userId: string) {
  const settings = await getSettings();
  await ensureBono(userId);
  const [bono] = await prisma.$transaction([
    prisma.bono.update({
      where: { userId },
      data: { remaining: { increment: 8 }, cycleLabel: settings.nextCycleLabel },
    }),
    prisma.bonoRenewal.create({
      data: { userId, cycleLabel: settings.nextCycleLabel, sessionsAdded: 8 },
    }),
  ]);
  return bono;
}

/** "Pendiente de renovar" = hasn't been brought current with the studio's
 *  declared next cycle yet — covers both members mid-cycle and brand-new
 *  approvals still sitting on "Sin bono". */
export async function pendingRenewalUsers() {
  const settings = await getSettings();
  return prisma.user.findMany({
    where: { status: 'ACTIVE', bono: { cycleLabel: { not: settings.nextCycleLabel } } },
    include: { bono: true },
    orderBy: { name: 'asc' },
  });
}

export async function renewAllPending() {
  const users = await pendingRenewalUsers();
  for (const u of users) await renewOne(u.id);
  return users.length;
}

export function bonoStatusLabel(remaining: number): 'Activo' | 'Agotado' {
  return remaining > 0 ? 'Activo' : 'Agotado';
}
