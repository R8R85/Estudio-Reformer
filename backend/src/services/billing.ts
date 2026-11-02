import Stripe from 'stripe';
import { prisma } from '../db';
import { badRequest } from '../lib/errors';

/**
 * Stripe Billing — test-mode scaffold.
 *
 * This is wired end-to-end (checkout, customer portal, webhook → plan
 * update) and works today against a Stripe *test* account: create one for
 * free, grab its test secret key + a webhook signing secret, create three
 * recurring Prices (one per paid plan) in test mode, and set:
 *
 *   STRIPE_SECRET_KEY=sk_test_...
 *   STRIPE_WEBHOOK_SECRET=whsec_...
 *   STRIPE_PRICE_SOLO=price_...
 *   STRIPE_PRICE_ESTUDIO=price_...
 *   STRIPE_PRICE_CADENA=price_...
 *   APP_BASE_URL=http://localhost:5173   (where Checkout/Portal redirect back to)
 *
 * Going to *production* needs nothing more from this code — only a live
 * Stripe account with real keys/prices, which only the account owner can
 * create (it requires their own business/bank details). Swap the test keys
 * for live ones in the production environment and everything below keeps
 * working unchanged.
 */

export const PLAN_LIMITS: Record<string, { memberLimit: number; whatsappEnabled: boolean; multiSede: boolean }> = {
  TRIAL: { memberLimit: 60, whatsappEnabled: false, multiSede: false },
  SOLO: { memberLimit: 60, whatsappEnabled: false, multiSede: false },
  ESTUDIO: { memberLimit: 250, whatsappEnabled: true, multiSede: false },
  CADENA: { memberLimit: 100000, whatsappEnabled: true, multiSede: true },
};

const PRICE_ENV_BY_PLAN: Record<string, string> = {
  SOLO: 'STRIPE_PRICE_SOLO',
  ESTUDIO: 'STRIPE_PRICE_ESTUDIO',
  CADENA: 'STRIPE_PRICE_CADENA',
};

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw badRequest('La facturación no está configurada (falta STRIPE_SECRET_KEY)');
  if (!stripeClient) stripeClient = new Stripe(key, { apiVersion: '2024-06-20' });
  return stripeClient;
}

function priceIdFor(plan: string): string {
  const envVar = PRICE_ENV_BY_PLAN[plan];
  const priceId = envVar && process.env[envVar];
  if (!priceId) throw badRequest(`No hay un precio de Stripe configurado para el plan ${plan}`);
  return priceId;
}

/** Starts (or resumes) a Stripe Checkout subscription flow for this tenant's
 *  chosen plan. Returns the URL to redirect the studio admin's browser to. */
export async function createCheckoutSession(tenantId: string, plan: 'SOLO' | 'ESTUDIO' | 'CADENA') {
  const stripe = getStripe();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: tenant.stripeCustomerId ?? undefined,
    client_reference_id: tenant.id,
    line_items: [{ price: priceIdFor(plan), quantity: 1 }],
    success_url: `${baseUrl}/billing/success?tenant=${tenant.id}`,
    cancel_url: `${baseUrl}/billing/cancelled?tenant=${tenant.id}`,
    subscription_data: { metadata: { tenantId: tenant.id, plan } },
    metadata: { tenantId: tenant.id, plan },
  });
  return session.url;
}

/** Stripe's self-serve "manage my subscription" page — update card, cancel,
 *  view invoices. Needs an existing Stripe customer (i.e. at least one
 *  completed checkout). */
export async function createPortalSession(tenantId: string) {
  const stripe = getStripe();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  if (!tenant.stripeCustomerId) throw badRequest('Este estudio todavía no tiene una suscripción de Stripe');
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${baseUrl}/billing`,
  });
  return session.url;
}

async function applyPlanToTenant(tenantId: string, plan: string, subscriptionStatus: string) {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.TRIAL;
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      plan,
      subscriptionStatus,
      planMemberLimit: limits.memberLimit,
      planWhatsappEnabled: limits.whatsappEnabled,
      planMultiSede: limits.multiSede,
    },
  });
}

/** Verifies and applies a Stripe webhook event. `rawBody` must be the exact
 *  bytes Stripe signed (express.raw(), never express.json()) — see the
 *  /webhooks/stripe route in index.ts. */
export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw badRequest('Falta STRIPE_WEBHOOK_SECRET');
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenantId || session.client_reference_id;
      const plan = session.metadata?.plan;
      if (tenantId && plan) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
          },
        });
        await applyPlanToTenant(tenantId, plan, 'active');
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenantId;
      const plan = subscription.metadata?.plan;
      if (tenantId) {
        const status = event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status;
        await applyPlanToTenant(tenantId, plan ?? 'TRIAL', status);
      }
      break;
    }
    default:
      break; // other event types aren't needed for plan/limit tracking
  }

  return { received: true };
}
