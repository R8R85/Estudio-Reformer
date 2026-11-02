# NEXOESTUDIO — web

The marketing site plus a real, working web dashboard for both roles — not a
mockup: every page in `src/pages/member/` and `src/pages/admin/` calls the
live multi-tenant API in `backend/`, the same one the iOS/Android apps use.

- **Landing** (`/`) — what the product does and the configurable settings
  each plan unlocks (franjas, bono sin caducidad, lista de espera, avisos,
  límites por plan), plus a 3D rendering of the NEXOESTUDIO mark built with
  Three.js, and scroll-reveal animation throughout via Framer Motion.
- **Login / Registro** (`/login`, `/registro`) — the same studio-code +
  email + password flow as the native apps, against `POST /auth/login` and
  `/auth/register`.
- **Panel de socia** (`/member`) — agenda, bono, reservas: book, cancel,
  join/leave a waitlist, accept/decline an offered place.
- **Panel de administración** (`/admin`) — agenda, franjas (CRUD), access
  requests, members + ficha, bono renewals, reminder settings, and billing
  (Stripe Checkout/portal).

## Running it

Requires Node 20+ and the backend running (`cd ../backend && npm run dev`).

```bash
npm install
cp .env.example .env.local   # VITE_API_URL — defaults to http://localhost:4000
npm run dev                  # http://localhost:5173
```

Test accounts — same ones the backend seed script prints:

| Studio code | Role   | Email                     | Password  |
|-------------|--------|---------------------------|-----------|
| `ENGUERA`   | Admin  | admin@estudioreformer.es  | admin123  |
| `ENGUERA`   | Member | lucia.ferrer@correo.com   | socia123  |

## Pointing it at a real domain

`VITE_API_URL` is the only thing that needs to change once the backend has a
real server + domain — set it in `.env.local` for local dev, or as a build
env var wherever this gets deployed (Vercel, Netlify, a static host behind
the eventual `nexoestudio.com`/`.app`). The backend's `CORS_ORIGIN` needs to
allow that deployed origin too (`backend/.env`).

`npm run build` outputs static files to `dist/` — this is a client-only SPA
(no server-side rendering), so any static host works.
