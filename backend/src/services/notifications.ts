import { prisma } from '../db';

/**
 * Stub notification sender.
 *
 * The product spec calls for an in-app push AND a WhatsApp message (to the
 * phone number captured at sign-up) for: the day-before reminder, and the
 * "a place freed up" waitlist alert. Wiring either channel for real needs
 * credentials this build doesn't have (a push provider + a WhatsApp
 * Business API / Twilio account) — see README "Notifications" section for
 * exactly what to plug in.
 *
 * Until then, every send lands as a row in `Notification` (visible via
 * GET /admin/notifications, scoped to that admin's own tenant) and a
 * console line, so the rest of the app's logic (who gets notified, when,
 * through which channels) is fully wired and easy to verify.
 */
export async function notify(tenantId: string, userId: string, channel: 'APP' | 'WHATSAPP', message: string) {
  await prisma.notification.create({ data: { tenantId, userId, channel, message } });
  // eslint-disable-next-line no-console
  console.log(`[notify:${channel}] tenant ${tenantId} -> user ${userId}: ${message}`);
}

export async function notifyBoth(tenantId: string, userId: string, message: string, settings: { app: boolean; whatsapp: boolean }) {
  if (settings.app) await notify(tenantId, userId, 'APP', message);
  if (settings.whatsapp) await notify(tenantId, userId, 'WHATSAPP', message);
}
