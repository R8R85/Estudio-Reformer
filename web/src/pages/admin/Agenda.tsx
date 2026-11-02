import { useCallback, useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { addDays, todayISO } from '../../lib/dates';
import { Badge, Card } from '../../components/ui';

export default function AdminAgenda() {
  const [date, setDate] = useState(todayISO());
  const [agenda, setAgenda] = useState<api.AdminAgendaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setError(null);
    try {
      setAgenda(await api.getAdminAgenda(d));
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo cargar la agenda');
    }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="mt-1 text-sm text-ink-muted capitalize">{agenda?.dayLabel} · {date}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDate(addDays(date, -1))} className="rounded-full border border-line px-4 py-2 text-sm hover:border-accent">← Día anterior</button>
          <button onClick={() => setDate(todayISO())} className="rounded-full border border-line px-4 py-2 text-sm hover:border-accent">Hoy</button>
          <button onClick={() => setDate(addDays(date, 1))} className="rounded-full border border-line px-4 py-2 text-sm hover:border-accent">Día siguiente →</button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-risk">{error}</p>}
      {!agenda && !error && <p className="mt-6 text-sm text-ink-muted">Cargando…</p>}
      {agenda?.closed && <p className="mt-6 text-sm text-ink-muted">El estudio no abre este día.</p>}

      <div className="mt-6 grid gap-3">
        {agenda?.sessions.map((s) => (
          <Card key={s.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-base font-semibold">{s.time} · {s.className}</p>
                <p className="text-sm text-ink-muted">{s.coachName}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={s.vacia ? 'warn' : s.pct >= 100 ? 'risk' : 'good'}>{s.occupied}/{s.capacity} ({s.pct}%)</Badge>
                {s.waitlistCount > 0 && <Badge tone="accent">{s.waitlistCount} en espera</Badge>}
              </div>
            </div>
            {s.attendeeNames.length > 0 && (
              <p className="mt-3 text-sm text-ink-muted">{s.attendeeNames.join(', ')}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
