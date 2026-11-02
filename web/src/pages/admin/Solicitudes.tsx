import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { Button, Card } from '../../components/ui';

export default function AdminSolicitudes() {
  const [requests, setRequests] = useState<api.AccessRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      setRequests((await api.getAccessRequests()).requests);
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudieron cargar las solicitudes');
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, fn: (id: string) => Promise<unknown>) {
    setBusyId(id);
    try {
      await fn(id);
      await load();
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'Algo falló');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Solicitudes de acceso</h1>
      <p className="mt-1 text-sm text-ink-muted">Aprobar una solicitud crea su bono vacío; la socia podrá reservar en cuanto se le asigne.</p>

      {error && <p className="mt-4 text-sm text-risk">{error}</p>}
      {requests.length === 0 && !error && <p className="mt-6 text-sm text-ink-muted">No hay solicitudes pendientes.</p>}

      <div className="mt-6 grid gap-3">
        {requests.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium">{r.nombre} <span className="text-xs text-ink-faint">({r.iniciales})</span></p>
              <p className="text-sm text-ink-muted">{r.contacto}</p>
              <p className="mt-1 text-xs text-ink-faint">{r.nota}</p>
            </div>
            <div className="flex gap-2">
              <Button className="!px-4 !py-2 text-xs" disabled={busyId === r.id} onClick={() => act(r.id, api.approveAccessRequest)}>Aprobar</Button>
              <Button kind="secondary" className="!px-4 !py-2 text-xs" disabled={busyId === r.id} onClick={() => act(r.id, api.rejectAccessRequest)}>Rechazar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
