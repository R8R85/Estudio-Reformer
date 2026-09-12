import { prisma } from '../db';

/** Singleton settings row (id 1), created on first read so a fresh DB
 *  doesn't need a separate migration-time seed just for this. */
export async function getSettings() {
  const existing = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.appSettings.create({ data: { id: 1 } });
}

export async function updateSettings(patch: Partial<{
  reminderEnabled: boolean;
  reminderChannelApp: boolean;
  reminderChannelWhatsapp: boolean;
}>) {
  await getSettings();
  return prisma.appSettings.update({ where: { id: 1 }, data: patch });
}

export async function advanceCycle() {
  const s = await getSettings();
  // Naive month-name advance is overkill for a manual, admin-triggered
  // action taken once a month — the admin can retype the label if they ever
  // need to skip/rename a cycle, this just saves the common case.
  const [monthName, yearStr] = s.nextCycleLabel.split(' ');
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const idx = MESES.indexOf(monthName);
  let year = Number(yearStr);
  let nextIdx = idx + 1;
  if (nextIdx >= 12) { nextIdx = 0; year += 1; }
  const newNext = idx === -1 ? s.nextCycleLabel : `${MESES[nextIdx]} ${year}`;
  return prisma.appSettings.update({
    where: { id: 1 },
    data: { currentCycleLabel: s.nextCycleLabel, nextCycleLabel: newNext },
  });
}
