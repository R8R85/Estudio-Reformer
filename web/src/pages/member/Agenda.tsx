import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as api from '../../lib/api';
import { addDays, todayISO } from '../../lib/dates';
import { Badge, Button, Card } from '../../components/ui';

export default function MemberAgenda() {
  const [date, setDate] = useState(todayISO());
  const [agenda, setAgenda] = useState<api.AgendaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setError(null);
    try {
      setAgenda(await api.getAgenda(d));
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo cargar la agenda');
    }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  async function act(sessionId: string, fn: () => Promise<unknown>) {
    setBusyId(sessionId);
    try {
      await fn();
      await load(date);
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'Algo falló');
    } finally {
      setBusyId(null);
    }
  }

  if (!agenda) return error ? <p className="text-sm text-risk">{error}</p> : <p className="text-sm text-ink-muted">Cargando agenda…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="mt-1 text-sm text-ink-muted capitalize">{agenda.dayLabel} · {agenda.date}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={agenda.bono.status === 'Activo' ? 'good' : 'risk'}>
            Bono: {agenda.bono.remaining} sesiones · {agenda.bono.cycleLabel}
          </Badge>
        </div>
      </div>

      {agenda.pendingOffer && (
        <Card className="mt-5 border-accent/40 bg-accent-soft">
          <p className="text-sm">
            Se ha liberado una plaza en <b>{agenda.pendingOffer.className}</b> ({agenda.pendingOffer.date} {agenda.pendingOffer.time}).
          </p>
          <div className="mt-3 flex gap-2">
            <Button className="!px-4 !py-2 text-xs" onClick={() => act(agenda.pendingOffer!.sessionId, () => api.acceptOffer(agenda.pendingOffer!.id))}>Confirmar</Button>
            <Button kind="secondary" className="!px-4 !py-2 text-xs" onClick={() => act(agenda.pendingOffer!.sessionId, () => api.declineOffer(agenda.pendingOffer!.id))}>Rechazar</Button>
          </div>
        </Card>
      )}

      {agenda.reminderTomorrow && (
        <p className="mt-4 text-sm text-ink-muted">
          Recordatorio: mañana tienes {agenda.reminderTomorrow.className} a las {agenda.reminderTomorrow.time}.
        </p>
      )}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {agenda.week.map((w) => (
          <button
            key={w.date}
            onClick={() => setDate(w.date)}
            className={`flex min-w-[52px] flex-col items-center rounded-xl2 border px-3 py-2 text-xs transition-colors ${
              w.date === date ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink-muted hover:border-accent'
            }`}
          >
            <span className="uppercase">{w.label}</span>
            <span className="mt-0.5 font-display text-base font-semibold">{w.num}</span>
          </button>
        ))}
        <button onClick={() => setDate(addDays(date, 7))} className="rounded-xl2 border border-line px-3 py-2 text-xs text-ink-muted hover:border-accent">
          Siguiente →
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-risk">{error}</p>}

      <div className="mt-6 grid gap-3">
        {agenda.closed && <p className="text-sm text-ink-muted">El estudio no abre este día.</p>}
        {agenda.sessions.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-base font-semibold">{s.time} · {s.className}</p>
                <p className="text-sm text-ink-muted">{s.coachName} · {s.plazasTxt}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={s.mine ? 'good' : s.waitlisted ? 'accent' : s.full ? 'risk' : 'accent'}>{s.estado}</Badge>
                {s.mine && s.bookingId && (
                  <Button kind="secondary" className="!px-4 !py-2 text-xs" disabled={busyId === s.id} onClick={() => act(s.id, () => api.cancelBooking(s.bookingId!))}>
                    Cancelar
                  </Button>
                )}
                {!s.mine && !s.waitlisted && !s.full && (
                  <Button className="!px-4 !py-2 text-xs" disabled={busyId === s.id} onClick={() => act(s.id, () => api.bookSession(s.id))}>
                    Reservar
                  </Button>
                )}
                {!s.mine && s.full && !s.waitlisted && (
                  <Button kind="secondary" className="!px-4 !py-2 text-xs" disabled={busyId === s.id} onClick={() => act(s.id, () => api.joinWaitlist(s.id))}>
                    Lista de espera
                  </Button>
                )}
                {s.waitlisted && s.waitlistEntryId && (
                  <Button kind="ghost" className="!px-4 !py-2 text-xs" disabled={busyId === s.id} onClick={() => act(s.id, () => api.leaveWaitlist(s.waitlistEntryId!))}>
                    Salir de la espera
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
