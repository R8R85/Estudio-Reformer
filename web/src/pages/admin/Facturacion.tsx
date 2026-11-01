import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { Badge, Button, Card } from '../../components/ui';

const PLAN_LABELS: Record<string, string> = { TRIAL: 'Prueba', SOLO: 'Solo', ESTUDIO: 'Estudio', CADENA: 'Cadena' };

export default function AdminFacturacion() {
  const [billing, setBilling] = useState<api.BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  async function load() {
    try {
      setBilling(await api.getBillingStatus());
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo cargar la facturación');
    }
  }

  useEffect(() => { load(); }, []);

  async function checkout(plan: 'SOLO' | 'ESTUDIO' | 'CADENA') {
    setBusyPlan(plan);
    try {
      const { url } = await api.startCheckout(plan);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo iniciar el pago — revisa que Stripe esté configurado');
    } finally {
      setBusyPlan(null);
    }
  }

  async function portal() {
    try {
      const { url } = await api.openBillingPortal();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'No se pudo abrir el portal de facturación');
    }
  }

  if (!billing) return error ? <p className="text-sm text-risk">{error}</p> : <p className="text-sm text-ink-muted">Cargando…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Facturación</h1>

      <Card className="mt-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-sm text-ink-muted">Plan actual</p>
          <p className="mt-1 font-display text-2xl font-semibold">{PLAN_LABELS[billing.plan] || billing.plan}</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <div><p className="text-ink-faint">Estado</p><Badge tone={billing.subscriptionStatus === 'active' ? 'good' : 'warn'}>{billing.subscriptionStatus}</Badge></div>
          <div><p className="text-ink-faint">Límite de socias</p><p className="font-medium">{billing.planMemberLimit}</p></div>
          <div><p className="text-ink-faint">WhatsApp</p><p className="font-medium">{billing.planWhatsappEnabled ? 'Incluido' : 'No incluido'}</p></div>
          <div><p className="text-ink-faint">Multi-sede</p><p className="font-medium">{billing.planMultiSede ? 'Incluido' : 'No incluido'}</p></div>
        </div>
      </Card>

      {error && <p className="mt-4 text-sm text-risk">{error}</p>}

      <h2 className="mt-8 font-display text-lg font-semibold">Cambiar de plan</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {(['SOLO', 'ESTUDIO', 'CADENA'] as const).map((plan) => (
          <Card key={plan} className="flex flex-col gap-3">
            <p className="font-display font-semibold">{PLAN_LABELS[plan]}</p>
            <Button kind={billing.plan === plan ? 'secondary' : 'primary'} disabled={billing.plan === plan} loading={busyPlan === plan} onClick={() => checkout(plan)} className="text-xs">
              {billing.plan === plan ? 'Plan actual' : 'Suscribirse'}
            </Button>
          </Card>
        ))}
      </div>

      {billing.hasStripeCustomer && (
        <Button kind="secondary" className="mt-6" onClick={portal}>Gestionar suscripción en Stripe</Button>
      )}

      <p className="mt-6 text-xs text-ink-faint">
        Si el pago no inicia, es porque la cuenta de Stripe de este entorno todavía está en modo prueba sin claves configuradas — ver <code>backend/.env.example</code>.
      </p>
    </div>
  );
}
