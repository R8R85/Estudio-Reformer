// Mirrors backend/src/services/sessions.ts date handling: plain "YYYY-MM-DD"
// strings, parsed as UTC midnight so arithmetic never drifts with the
// viewer's timezone.

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
