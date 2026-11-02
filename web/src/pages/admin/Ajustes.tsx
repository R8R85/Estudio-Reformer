import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { Card } from '../../components/ui';

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-4 py-3 ${disabled ? 'opacity-50' : ''}`}>
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-line'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

export default function AdminAjustes() {
  const [settings, setSettings] = useState<api.ReminderSettings | null>(null);
  const [billing, setBilling] = useState<api.BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getReminderSettings().then(setSettings).catch((err) => setError(err instanceof api.ApiError ? err.message : 'Error'));
    api.getBillingStatus().then(setBilling).catch(() => {});
  }, []);

  async function patch(update: Partial<api.ReminderSettings>) {
    if (!settings) return;
    const optimistic = { ...settings, ...update };
    setSettings(optimistic);
    try {
      const res = await api.updateReminderSettings(update);
      setSettings(res);
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo guardar');
      setSettings(settings);
    }
  }

  if (!settings) return error ? <p className="text-sm text-risk">{error}</p> : <p className="text-sm text-ink-muted">Cargando…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Ajustes</h1>
      <p className="mt-1 text-sm text-ink-muted">Recordatorio del día anterior — lo que se activa aquí se aplica a toda la agenda de tu estudio.</p>

      {error && <p className="mt-4 text-sm text-risk">{error}</p>}

      <Card className="mt-6 divide-y divide-line">
        <Toggle label="Recordatorio activado" checked={settings.reminderEnabled} onChange={(v) => patch({ reminderEnabled: v })} />
        <Toggle label="Enviar dentro de la app" checked={settings.reminderChannelApp} onChange={(v) => patch({ reminderChannelApp: v })} disabled={!settings.reminderEnabled} />
        <Toggle
          label={`Enviar por WhatsApp${billing && !billing.planWhatsappEnabled ? ' (no incluido en tu plan)' : ''}`}
          checked={settings.reminderChannelWhatsapp}
          onChange={(v) => patch({ reminderChannelWhatsapp: v })}
          disabled={!settings.reminderEnabled || (billing ? !billing.planWhatsappEnabled : false)}
        />
      </Card>
    </div>
  );
}
