import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { Badge, Card } from '../../components/ui';

export default function MemberBono() {
  const [bono, setBono] = useState<api.BonoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getBono().then(setBono).catch((err) => setError(err instanceof api.ApiError ? err.message : 'No se pudo cargar el bono'));
  }, []);

  if (error) return <p className="text-sm text-risk">{error}</p>;
  if (!bono) return <p className="text-sm text-ink-muted">Cargando…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Mi bono</h1>

      <Card className="mt-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-sm text-ink-muted">{bono.cycleLabel}</p>
          <p className="mt-1 font-display text-4xl font-semibold">{bono.remaining} <span className="text-base font-normal text-ink-muted">sesiones</span></p>
        </div>
        <Badge tone={bono.status === 'Activo' ? 'good' : 'risk'}>{bono.status}</Badge>
      </Card>

      <h2 className="mt-8 font-display text-lg font-semibold">Movimientos recientes</h2>
      <div className="mt-4 grid gap-2">
        {bono.movimientos.length === 0 && <p className="text-sm text-ink-muted">Sin movimientos todavía.</p>}
        {bono.movimientos.map((m, i) => (
          <Card key={i} className="flex items-center justify-between !py-4">
            <div>
              <p className="text-sm font-medium">{m.titulo}</p>
              <p className="text-xs text-ink-faint">{new Date(m.fecha).toLocaleDateString('es-ES')}</p>
            </div>
            <span className={`font-display text-sm font-semibold ${m.delta.startsWith('+') ? 'text-good' : 'text-ink-muted'}`}>{m.delta}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
