import { prisma } from '../db';

/** The API deals only in plain "YYYY-MM-DD" dates + "HH:mm" times — there's a
 *  single studio location, so we don't need timezone-aware storage, just
 *  consistent parsing (always as UTC-midnight, never the server's local TZ). */
export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

/** JS Date#getDay() convention: 0 = Sunday … 6 = Saturday. */
export function dayOfWeekFor(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Minutes from "now" (server clock) until `date`+`time` starts. Negative
 *  once the session has begun. */
export function minutesUntil(date: string, time: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const target = new Date(Date.UTC(y, m - 1, d, hh, mm)).getTime();
  return Math.round((target - Date.now()) / 60000);
}

/** The 7 dates of the Mon–Sun week containing `date` (matches the
 *  prototype's day strip, which always shows a full week starting Monday). */
export function weekDatesContaining(date: string): string[] {
  const dow = dayOfWeekFor(date); // 0=Sun..6=Sat
  const mondayOffset = dow === 0 ? -6 : 1 - dow; // shift back to Monday
  const monday = addDays(date, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const DIA_LABELS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
export function diaLabel(date: string): string {
  return DIA_LABELS[dayOfWeekFor(date)];
}

/** Materializes the ClassSession rows for every ClassTemplate active on
 *  `date`'s weekday, if they don't already exist. Idempotent — safe to call
 *  on every request that needs that date's agenda. This is what lets admins
 *  edit a template's time/name/capacity going forward without rewriting
 *  history for dates whose sessions (and any bookings on them) already
 *  exist. */
export async function ensureSessionsForDate(date: string) {
  const dow = dayOfWeekFor(date);
  const templates = await prisma.classTemplate.findMany({ where: { dayOfWeek: dow } });
  for (const t of templates) {
    await prisma.classSession.upsert({
      where: { templateId_date: { templateId: t.id, date } },
      update: {},
      create: {
        templateId: t.id,
        date,
        time: t.time,
        className: t.className,
        coachName: t.coachName,
        capacity: t.capacity,
      },
    });
  }
}

export async function getSessionsForDate(date: string) {
  await ensureSessionsForDate(date);
  return prisma.classSession.findMany({
    where: { date },
    orderBy: { time: 'asc' },
    include: {
      bookings: { where: { status: 'CONFIRMED' }, include: { user: true } },
      waitlist: { orderBy: { position: 'asc' }, include: { user: true } },
    },
  });
}
