import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { Button, Card, Field, Input } from '../../components/ui';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AdminFranjas() {
  const [templates, setTemplates] = useState<api.ClassTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ dayOfWeek: 1, time: '08:00', className: '', coachName: '', capacity: 2 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load() {
    try {
      const res = await api.getClassTemplates();
      setTemplates(res.templates.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.time.localeCompare(b.time)));
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudieron cargar las franjas');
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.createClassTemplate(form);
      setForm({ ...form, className: '', coachName: '' });
      await load();
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo crear la franja');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteClassTemplate(id);
      await load();
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo eliminar');
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Franjas</h1>
      <p className="mt-1 text-sm text-ink-muted">Horario semanal recurrente. Editar una franja solo afecta a las sesiones futuras.</p>

      <Card className="mt-6">
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-5">
          <Field label="Día">
            <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })} className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm">
              {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </Field>
          <Field label="Hora">
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
          </Field>
          <Field label="Clase">
            <Input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} placeholder="Reformer Flow" required />
          </Field>
          <Field label="Instructor/a">
            <Input value={form.coachName} onChange={(e) => setForm({ ...form, coachName: e.target.value })} placeholder="Marta" required />
          </Field>
          <Field label="Aforo">
            <Input type="number" min={1} max={20} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} required />
          </Field>
          <div className="md:col-span-5">
            <Button type="submit" loading={isSubmitting}>Añadir franja</Button>
          </div>
        </form>
      </Card>

      {error && <p className="mt-4 text-sm text-risk">{error}</p>}

      <div className="mt-6 grid gap-2">
        {templates.map((t) => (
          <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3 !py-4">
            <div>
              <p className="text-sm font-medium">{DIAS[t.dayOfWeek]} · {t.time} · {t.className}</p>
              <p className="text-xs text-ink-faint">{t.coachName} · aforo {t.capacity}</p>
            </div>
            <button onClick={() => handleDelete(t.id)} className="text-xs text-risk hover:underline">Eliminar</button>
          </Card>
        ))}
      </div>
    </div>
  );
}
