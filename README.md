# NEXOESTUDIO

> "NEXOESTUDIO" is the name of the **software itself** (the vendor's
> product), as distinct from "Estudio Reformer", which is one *customer*
> (a tenant) running it. The logo (a solid node linked to an open ring — a
> studio joining the platform) lives in the branding artifact shared
> alongside this project; export it to `project/assets/` once it's
> finalized as real files.

A multi-tenant booking app for Pilates reformer studios: members book
sessions from a weekly agenda against an 8-session bono (pack) that never
expires, join a waitlist when a slot is full, and get bumped up automatically
when someone cancels; each studio's own admin manages its schedule, approves
new members, and renews bonos by hand each month — all on one shared app and
API, serving as many studios as sign up.

This started from a Claude Design handoff for a single studio, "Estudio
Reformer" in Enguera (Valencia) (see **Design source** below), and was then
extended into a sellable multi-tenant SaaS product, per the project's own
decisions:

- **Platform:** native iOS (SwiftUI) + native Android (Kotlin/Jetpack Compose)
- **Scope:** full stack — real auth, a database, multi-tenant isolation,
  Stripe billing (test mode), and every booking/waitlist/admin rule from the
  original design, working end to end
- **Notifications:** stubbed — see [Notifications](#notifications-stubbed) below

## Layout

```
backend/    Node.js + TypeScript + Express + Prisma (SQLite) API
ios/        SwiftUI app (XcodeGen project spec + sources)
android/    Kotlin + Jetpack Compose app (Gradle project)
project/    the original Claude Design prototype (HTML/CSS/JS) — kept for reference
chats/      the design conversation transcripts that shaped the product rules
```

## Design source

`project/Agenda Reformer.dc.html` is the interactive mockup this app's
single-studio behavior implements, built with Claude Design (claude.ai/design)
and iterated over the two conversations in `chats/`. It's a single-file,
client-side simulation of one studio — no real backend, no multi-tenancy, no
real notifications — used here as the spec for visuals, copy, and the
booking/cancellation/waitlist rules. The apps in `ios/` and `android/`
recreate it as real, working software rather than importing its code
directly — see the file's own comments for the full interaction spec if you
need to check an edge case against the original design intent.

## Multi-tenancy

One shared app/API serves every studio ("tenant"). A studio is identified by
a short **"código de estudio"**, entered at member sign-up and login (and
usable anonymously via `GET /studio?code=...` to show a studio's name before
auth) — there's no subdomain or separate deployment per client.

- **Isolation:** every tenant-owned database row carries its own `tenantId`
  column, even where it could be inferred through a join — every query
  filters on a column it already has, rather than trusting a join chain to
  stay correct forever. See the design notes at the top of
  `backend/prisma/schema.prisma`.
- **Roles:** `MEMBER` and `ADMIN` belong to one tenant; `PLATFORM_ADMIN` (the
  software vendor's own operators) belongs to none (`tenantId` is null) and
  manages tenants instead, via `POST /platform/login` + `/platform/tenants`
  (see `backend/src/routes/platform.ts`). There's no public sign-up for this
  role — create one by hand (Prisma Studio, or copy the seed script's pattern).
- **Plans & limits:** `Tenant.plan` (`TRIAL` / `SOLO` / `ESTUDIO` / `CADENA`)
  drives `planMemberLimit`, `planWhatsappEnabled`, and `planMultiSede`,
  enforced in `backend/src/routes/admin.ts` (e.g. approving a new member past
  the plan's limit is rejected) rather than hardcoded. `PLAN_LIMITS` in
  `backend/src/services/billing.ts` is the single source of truth for what
  each plan includes.

## Billing (Stripe, test mode)

`backend/src/services/billing.ts` and `backend/src/routes/billing.ts`
(mounted at `/admin/billing`) wire up Stripe Checkout (subscribe to a plan),
the Stripe customer portal (manage/cancel), and a webhook
(`POST /webhooks/stripe`) that updates a tenant's plan/limits when a
subscription is created, changed, or cancelled. This works **today** against
a free Stripe test account — see the comment at the top of `billing.ts` for
the five environment variables it needs (`STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, one `STRIPE_PRICE_*` per paid plan, `APP_BASE_URL`).

Going to **production** billing needs nothing further from this code — only
a real, live Stripe account (business/bank details, which only the account
owner can provide) and swapping the test keys for live ones.

## Product rules (per tenant, implemented in `backend/`)

- **Bono:** 8 sessions, no expiry — a running credit balance, topped up by
  +8 whenever the studio renews it (never reset to 8 flat), so unused
  sessions carry over.
- **Capacity:** 2 places per session by default, editable per franja
  (recurring weekly slot) by that studio's admin.
- **Cancellation:** blocked less than 6 hours before a session starts; a
  session not cancelled in time is still deducted from the bono.
- **Waitlist:** join when a session is full; when a confirmed booking frees
  up, the freed place is offered to the head of the waitlist with a 30-minute
  window to accept before it cascades to the next person.
- **Access requests:** new members submit a studio code plus
  name/email/phone/password and two health-screening questions (prior
  Pilates experience, any physical limitation) and wait for that studio's
  admin approval before they can see the agenda or book anything.
- **Privacy split:** members only ever see seat counts for a session; real
  attendee names, health notes, and contact details are admin-only (the
  member ficha/profile view) — and only within their own studio.
- **Admin:** approves/rejects access requests (capped by the plan's member
  limit), edits franjas (time, name, instructor, capacity), releases a
  member's booking on their behalf, renews one or all pending bonos for the
  "next cycle", toggles the day-before reminder and its channels (in-app /
  WhatsApp, the latter plan-gated), and manages billing.

## Notifications (stubbed)

The day-before reminder and the "a place freed up" waitlist alert are fully
wired end to end — the rules for who gets notified, when, and through which
channel(s) are real — but sending is **stubbed**: every send is written to
a `Notification` row (visible via `GET /admin/notifications`, scoped to the
admin's own tenant) and logged to the server console instead of calling a
real provider, since that needs credentials this build doesn't have.

To wire it for real:
- **Push:** add Firebase Cloud Messaging (or APNs directly for iOS), store a
  device token per user, and call the provider from
  `backend/src/services/notifications.ts` instead of the `console.log`.
- **WhatsApp:** add a WhatsApp Business API account (e.g. via Twilio) and
  send to `user.phone` from the same file.

## Running the backend

Requires Node.js 20+.

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate   # creates dev.db and applies the schema
npm run seed             # 2 demo tenants + platform admin, for isolation testing
npm run dev              # http://localhost:4000
```

Test accounts (also printed by the seed script):

| Studio code | Role      | Email                          | Password     |
|-------------|-----------|---------------------------------|---------------|
| —           | Platform  | platform@nexoestudio.app        | platform123   |
| `ENGUERA`   | Admin     | admin@estudioreformer.es        | admin123      |
| `ENGUERA`   | Member    | lucia.ferrer@correo.com         | socia123      |
| `VALENCIA`  | Admin     | admin@pilatesvalencia.es        | admin123      |
| `VALENCIA`  | Member    | marc.esteve@correo.com          | socia123      |

The two studio tenants exist specifically so isolation is checkable by hand:
log into each and confirm neither's agenda, members, or bonos ever show the
other's data (and that `ENGUERA`'s admin credentials fail when submitted
with studio code `VALENCIA`, and vice versa).

`GET /health` should return `{"ok":true}` once it's running. See
`backend/src/routes/*.ts` for the full API surface.

## Running the iOS app

Requires a Mac with Xcode 15+ and [XcodeGen](https://github.com/yonaskolb/XcodeGen)
(`brew install xcodegen`) — this environment has neither, so the app hasn't
been built or run here; only written and reviewed.

```bash
cd ios
xcodegen generate
open EstudioReformer.xcodeproj
```

Run on the Simulator with the backend running locally — `AppConfig.baseURL`
in `Networking/APIClient.swift` defaults to `http://localhost:4000`, which
the Simulator can reach directly since it shares the Mac's network stack. For
a physical device, change it to `http://<your-Mac's-LAN-IP>:4000`. The
login/sign-up screens now also ask for the studio code (`ENGUERA` /
`VALENCIA` against the seed data) — see `Features/Auth/LoginView.swift` and
`RegisterView.swift`.

## Running the Android app

Requires Android Studio (Gradle + an Android SDK) — also not available in
this environment, so likewise written and reviewed but not built here.

Open the `android/` folder in Android Studio and let it sync, or from the
CLI once you have a `gradle` wrapper generated (`gradle wrapper` from a
machine with Gradle installed, since the wrapper jar isn't checked in here):

```bash
cd android
./gradlew installDebug
```

The emulator does **not** share the host's network stack the way the iOS
Simulator does — `AppConfig.DEFAULT_BASE_URL` in
`network/ApiClient.kt` defaults to `http://10.0.2.2:4000`, the emulator's
documented alias for the host machine's `localhost`. For a physical device,
change it (persisted via `AppConfig.baseUrl`) to
`http://<your-computer's-LAN-IP>:4000`. The login/sign-up screens now also
ask for the studio code — see `ui/auth/LoginScreen.kt` and
`RegisterScreen.kt`.

## What's not included

Everything below is a deliberate scope cut for *this* build, not a bug — see
the monetization/go-to-market artifact shared alongside this project for the
full punch list of what else is needed before selling this to real studios
(registering "NEXOESTUDIO" as a trademark, production hosting + domain + HTTPS, real
Apple/Google developer accounts and signed store builds, a live Stripe account,
legal/fiscal registration, a GDPR health-data DPA per tenant, etc.) — none of
which can be done from inside this environment.

- Automated tests (none were requested; the backend's business logic —
  including multi-tenant isolation — was exercised manually end to end while
  building it; see the curl-based isolation checks described above).
- Real push/WhatsApp delivery (see [Notifications](#notifications-stubbed)).
- Live Stripe billing (see [Billing](#billing-stripe-test-mode) — test mode
  only; going live needs a real Stripe account).
- Compiled/signed iOS or Android builds, or app-store listings.
- App icons / store assets beyond the studio's own logo
  (`project/assets/logo-mark.png`, `project/assets/logo-lockup.png`), copied
  into each app's own resources and used in the UI itself.
