import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { Badge, Button, Card, Input } from '../../components/ui';

export default function AdminSocios() {
  const [members, setMembers] = useState<api.MemberSummary[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<api.MemberFicha | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(q = '') {
    try {
      setMembers((await api.getMembers(q)).members);
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudieron cargar las socias');
    }
  }

  useEffect(() => { load(); }, []);

  async function openFicha(id: string) {
    try {
      setSelected(await api.getMemberFicha(id));
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo abrir la ficha');
    }
  }

  async function renew(id: string) {
    setBusyId(id);
    try {
      await api.renewMember(id);
      await load(query);
      if (selected?.id === id) openFicha(id);
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo renovar');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Socias</h1>

      <div className="mt-5 max-w-sm">
        <Input
          placeholder="Buscar por nombre…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); load(e.target.value); }}
        />
      </div>

      {error && <p className="mt-4 text-sm text-risk">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid gap-2">
          {members.map((m) => (
            <Card
              key={m.id}
              hover
              className={`cursor-pointer !py-4 ${selected?.id === m.id ? 'border-accent/50' : ''}`}
              onClick={() => openFicha(m.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{m.nombre}</p>
                  <p className="text-xs text-ink-faint">{m.detalle}</p>
                </div>
                <Button
                  kind={m.pendienteRenovar ? 'primary' : 'ghost'}
                  className="!px-3 !py-1.5 text-xs"
                  disabled={busyId === m.id}
                  onClick={(e) => { (e as unknown as Event).stopPropagation?.(); renew(m.id); }}
                >
                  {m.btnTexto}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card className="h-fit">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-semibold">{selected.nombre}</p>
                <p className="text-sm text-ink-muted">{selected.email} · {selected.tel}</p>
              </div>
              <Badge tone={selected.hayLimitacion ? 'warn' : 'good'}>{selected.estadoBono}</Badge>
            </div>
            <p className="mt-4 text-sm text-ink-muted">{selected.alta}</p>
            <p className="mt-2 text-sm">{selected.experiencia}</p>
            <p className="mt-1 text-sm">{selected.patologia}{selected.hayLimitacion ? ` — ${selected.limitacion}` : ''}</p>
            <p className="mt-3 text-sm font-medium">{selected.resumen}</p>

            <div className="mt-5 flex flex-col gap-3">
              {selected.bonos.map((b, i) => (
                <div key={i} className="rounded-lg border border-line p-3">
                  <p className="text-sm font-medium">{b.mes}</p>
                  <p className="text-xs text-ink-faint">{b.resumen}</p>
                  {!b.vacio && (
                    <ul className="mt-2 flex flex-col gap-1 text-xs text-ink-muted">
                      {b.sesiones.map((s, j) => <li key={j}>{s.fecha} · {s.clase}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
