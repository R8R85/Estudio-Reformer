import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import { authRouter } from './routes/auth';
import { memberRouter } from './routes/member';
import { adminRouter } from './routes/admin';
import { billingRouter } from './routes/billing';
import { platformRouter } from './routes/platform';
import { HttpError } from './lib/errors';
import { prisma } from './db';
import { handleStripeWebhook } from './services/billing';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Stripe needs the exact raw request bytes to verify a webhook's signature,
// so this route must be registered BEFORE express.json() swallows the body.
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    res.status(400).json({ error: 'Falta la cabecera stripe-signature' });
    return;
  }
  handleStripeWebhook(req.body as Buffer, signature)
    .then((result) => res.json(result))
    .catch(next);
});

app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

// Looked up by "código de estudio" so the login/sign-up screen can greet
// someone with their studio's name before they've authenticated.
app.get('/studio', async (req, res) => {
  const code = String(req.query.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'Falta el código del estudio' });
  const tenant = await prisma.tenant.findUnique({ where: { code } });
  if (!tenant) return res.status(404).json({ error: 'No existe ningún estudio con ese código' });
  res.json({ name: tenant.name, location: tenant.location });
});

app.use('/auth', authRouter);
app.use('/member', memberRouter);
app.use('/admin', adminRouter);
app.use('/admin/billing', billingRouter);
app.use('/platform', platformRouter);

app.use((req, res) => {
  res.status(404).json({ error: `No existe ${req.method} ${req.path}` });
});

// Central error handler — every route's errors funnel here via asyncHandler.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Reformer OS API escuchando en http://localhost:${port}`);
});
