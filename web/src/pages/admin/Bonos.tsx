import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { Button, Card } from '../../components/ui';

export default function AdminBonos() {
  const [summary, setSummary] = useState<api.BonosSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setSummary(await api.getBonosSummary());
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo cargar el resumen');
    }
  }

  useEffect(() => { load(); }, []);

  async function renewAll() {
    setBusy(true);
    try {
      await api.renewAllPending();
      await load();
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo renovar');
    } finally {
      setBusy(false);
    }
  }

  async function advance() {
    setBusy(true);
    try {
      await api.advanceCycle();
      await load();
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo avanzar el ciclo');
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="text-sm text-risk">{error}</p>;
  if (!summary) return <p className="text-sm text-ink-muted">Cargando…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Bonos</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card><p className="text-xs text-ink-muted">Ciclo actual</p><p className="mt-1 font-display text-xl font-semibold">{summary.cicloActual}</p></Card>
        <Card><p className="text-xs text-ink-muted">Renovadas</p><p className="mt-1 font-display text-xl font-semibold">{summary.numRenovados}</p></Card>
        <Card><p className="text-xs text-ink-muted">Pendientes</p><p className="mt-1 font-display text-xl font-semibold">{summary.numPendientes}</p></Card>
      </div>

      <div className="mt-6 flex gap-3">
        <Button loading={busy} onClick={renewAll} disabled={summary.numPendientes === 0}>Renovar todas las pendientes</Button>
        <Button kind="secondary" loading={busy} onClick={advance}>Avanzar ciclo → {summary.cicloSiguiente}</Button>
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold">Pendientes de renovar</h2>
      <div className="mt-4 grid gap-2">
        {summary.pendientes.length === 0 && <p className="text-sm text-ink-muted">Nadie pendiente — todo al día.</p>}
        {summary.pendientes.map((p) => (
          <Card key={p.id} className="flex items-center justify-between !py-3">
            <p className="text-sm font-medium">{p.nombre}</p>
            <p className="text-xs text-ink-faint">{p.detalle}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
