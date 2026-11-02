import { useCallback, useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { Badge, Button, Card } from '../../components/ui';

export default function MemberReservas() {
  const [data, setData] = useState<api.ReservasResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.getReservas());
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudieron cargar las reservas');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function cancel(bookingId: string) {
    setBusyId(bookingId);
    try {
      await api.cancelBooking(bookingId);
      await load();
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo cancelar');
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <p className="text-sm text-risk">{error}</p>;
  if (!data) return <p className="text-sm text-ink-muted">Cargando…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Mis reservas</h1>

      <h2 className="mt-8 font-display text-lg font-semibold">Próximas</h2>
      <div className="mt-4 grid gap-2">
        {data.proximas.length === 0 && <p className="text-sm text-ink-muted">No tienes sesiones próximas.</p>}
        {data.proximas.map((r) => (
          <Card key={r.bookingId} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{r.dayLabel} · {r.time} · {r.className}</p>
              <p className="text-xs text-ink-faint">{r.coachName}</p>
            </div>
            {r.cancelable ? (
              <Button kind="secondary" className="!px-4 !py-2 text-xs" disabled={busyId === r.bookingId} onClick={() => cancel(r.bookingId)}>Cancelar</Button>
            ) : (
              <span className="text-xs text-ink-faint">{r.cancelNote}</span>
            )}
          </Card>
        ))}
      </div>

      {data.espera.length > 0 && (
        <>
          <h2 className="mt-8 font-display text-lg font-semibold">Lista de espera</h2>
          <div className="mt-4 grid gap-2">
            {data.espera.map((e) => (
              <Card key={e.entryId} className="flex items-center justify-between">
                <p className="text-sm">{e.date} · {e.time} · {e.className}</p>
                <Badge tone="accent">Puesto {e.position} de {e.total}</Badge>
              </Card>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-8 font-display text-lg font-semibold">Historial</h2>
      <div className="mt-4 grid gap-2">
        {data.historial.length === 0 && <p className="text-sm text-ink-muted">Todavía no hay sesiones pasadas.</p>}
        {data.historial.map((h, i) => (
          <Card key={i} className="flex items-center justify-between !py-3">
            <p className="text-sm text-ink-muted">{h.dayLabel} · {h.className}</p>
            <span className="text-xs text-ink-faint">{h.estado}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
