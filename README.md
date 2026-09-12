# Estudio Reformer

A booking app for a Pilates reformer studio in Enguera (Valencia): members book
sessions from a weekly agenda against an 8-session bono (pack) that never
expires, join a waitlist when a slot is full, and get bumped up automatically
when someone cancels; the studio's admin manages the schedule, approves new
members, and renews bonos by hand each month.

This was implemented from a Claude Design handoff (see **Design source**
below) as a real backend plus **native iOS and Android apps**, per the
project's own decisions:

- **Platform:** native iOS (SwiftUI) + native Android (Kotlin/Jetpack Compose)
- **Scope:** full stack — real auth, a database, and every booking/waitlist/
  admin rule from the design, working end to end
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

`project/Agenda Reformer.dc.html` is the interactive mockup this app
implements, built with Claude Design (claude.ai/design) and iterated over the
two conversations in `chats/`. It's a single-file, client-side simulation —
no real backend, no real notifications — used here as the spec for visuals,
copy, and behavior (dark "Nocturne" theme, the exact screens and sheets, the
booking/cancellation/waitlist rules). The apps in `ios/` and `android/`
recreate it as real, working software rather than importing its code
directly — see the file's own comments for the full interaction spec if you
need to check an edge case against the original design intent.

## Product rules (implemented in `backend/`)

- **Bono:** 8 sessions, no expiry — a running credit balance, topped up by
  +8 whenever the studio renews it (never reset to 8 flat), so unused
  sessions carry over.
- **Capacity:** 2 places per session by default, editable per franja
  (recurring weekly slot) by the admin.
- **Cancellation:** blocked less than 6 hours before a session starts; a
  session not cancelled in time is still deducted from the bono.
- **Waitlist:** join when a session is full; when a confirmed booking frees
  up, the freed place is offered to the head of the waitlist with a 30-minute
  window to accept before it cascades to the next person.
- **Access requests:** new members submit name/email/phone/password plus two
  health-screening questions (prior Pilates experience, any physical
  limitation) and wait for admin approval before they can see the agenda or
  book anything.
- **Privacy split:** members only ever see seat counts for a session; real
  attendee names, health notes, and contact details are admin-only (the
  member ficha/profile view).
- **Admin:** approves/rejects access requests, edits franjas (time, name,
  instructor, capacity), releases a member's booking on their behalf, renews
  one or all pending bonos for the "next cycle", and toggles the day-before
  reminder and its channels (in-app / WhatsApp).

## Notifications (stubbed)

The day-before reminder and the "a place freed up" waitlist alert are fully
wired end to end — the rules for who gets notified, when, and through which
channel(s) are real — but sending is **stubbed**: every send is written to
a `Notification` row (visible via `GET /admin/notifications`) and logged to
the server console instead of calling a real provider, since that needs
credentials this build doesn't have.

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
npm run seed             # demo studio, admin, members, access requests
npm run dev              # http://localhost:4000
```

Test accounts (also printed by the seed script):

| Role   | Email                          | Password    |
|--------|---------------------------------|-------------|
| Admin  | admin@estudioreformer.es        | admin123    |
| Member | lucia.ferrer@correo.com         | socia123    |

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
a physical device, change it to `http://<your-Mac's-LAN-IP>:4000`.

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
`http://<your-computer's-LAN-IP>:4000`.

## What's not included

- Automated tests (none were requested; the backend's business logic was
  exercised manually end to end — booking, cancellation, waitlist cascade,
  offer accept, admin renewals — while building it).
- Real push/WhatsApp delivery (see [Notifications](#notifications-stubbed)).
- App icons / store assets beyond the studio's own logo
  (`project/assets/logo-mark.png`, `project/assets/logo-lockup.png`), copied
  into each app's own resources and used in the UI itself.
