import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import { authRouter } from './routes/auth';
import { memberRouter } from './routes/member';
import { adminRouter } from './routes/admin';
import { HttpError } from './lib/errors';
import { getSettings } from './services/settings';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/studio', async (_req, res) => {
  const s = await getSettings();
  res.json({ name: s.studioName, location: s.location });
});

app.use('/auth', authRouter);
app.use('/member', memberRouter);
app.use('/admin', adminRouter);

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
  console.log(`Estudio Reformer API escuchando en http://localhost:${port}`);
});
