import { prisma } from '../db';
import { notFound } from '../lib/errors';

/** What used to be the single `AppSettings` row is now just the settings
 *  columns on that tenant's own row — "the studio's settings" instead of
 *  "the settings". */
export async function getTenantSettings(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw notFound('Estudio no encontrado');
  return tenant;
}

export async function updateReminderSettings(tenantId: string, patch: Partial<{
  reminderEnabled: boolean;
  reminderChannelApp: boolean;
  reminderChannelWhatsapp: boolean;
}>) {
  return prisma.tenant.update({ where: { id: tenantId }, data: patch });
}

export async function advanceCycle(tenantId: string) {
  const t = await getTenantSettings(tenantId);
  // Naive month-name advance is overkill for a manual, admin-triggered
  // action taken once a month — the admin can retype the label if they ever
  // need to skip/rename a cycle, this just saves the common case.
  const [monthName, yearStr] = t.nextCycleLabel.split(' ');
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const idx = MESES.indexOf(monthName);
  let year = Number(yearStr);
  let nextIdx = idx + 1;
  if (nextIdx >= 12) { nextIdx = 0; year += 1; }
  const newNext = idx === -1 || Number.isNaN(year) ? t.nextCycleLabel : `${MESES[nextIdx]} ${year}`;
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { currentCycleLabel: t.nextCycleLabel, nextCycleLabel: newNext },
  });
}
