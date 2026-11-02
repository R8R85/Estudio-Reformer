import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { validateBody } from '../lib/validate';
import { requireAuth, requireAdmin, AuthedRequest } from '../middleware/auth';
import { getTenantSettings } from '../services/settings';
import { createCheckoutSession, createPortalSession } from '../services/billing';

export const billingRouter = Router();
billingRouter.use(requireAuth, requireAdmin);

const checkoutSchema = z.object({ plan: z.enum(['SOLO', 'ESTUDIO', 'CADENA']) });

billingRouter.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  const t = await getTenantSettings(req.tenantId!);
  res.json({
    plan: t.plan,
    subscriptionStatus: t.subscriptionStatus,
    trialEndsAt: t.trialEndsAt,
    planMemberLimit: t.planMemberLimit,
    planWhatsappEnabled: t.planWhatsappEnabled,
    planMultiSede: t.planMultiSede,
    hasStripeCustomer: !!t.stripeCustomerId,
  });
}));

billingRouter.post('/checkout', validateBody(checkoutSchema), asyncHandler(async (req: AuthedRequest, res) => {
  const url = await createCheckoutSession(req.tenantId!, req.body.plan);
  res.json({ url });
}));

billingRouter.post('/portal', asyncHandler(async (req: AuthedRequest, res) => {
  const url = await createPortalSession(req.tenantId!);
  res.json({ url });
}));
