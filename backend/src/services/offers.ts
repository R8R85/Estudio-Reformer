import { prisma } from '../db';
import { getSettings } from './settings';
import { notifyBoth } from './notifications';

const OFFER_WINDOW_MINUTES = 30;

/** Reindexes a session's waitlist to a dense 1..N ordering after a removal. */
async function reindexWaitlist(sessionId: string) {
  const entries = await prisma.waitlistEntry.findMany({
    where: { sessionId },
    orderBy: { position: 'asc' },
  });
  await Promise.all(
    entries.map((e, i) =>
      e.position === i + 1 ? null : prisma.waitlistEntry.update({ where: { id: e.id }, data: { position: i + 1 } })
    )
  );
}

/** Called whenever a confirmed booking frees up (member cancels ≥6h out, or
 *  an admin releases a place): offers the freed slot to the head of that
 *  session's waitlist, with a 30-minute window to accept before it cascades
 *  to the next person in line. */
export async function cascadeToNextWaitlisted(sessionId: string) {
  const head = await prisma.waitlistEntry.findFirst({
    where: { sessionId },
    orderBy: { position: 'asc' },
  });
  if (!head) return null;

  const session = await prisma.classSession.findUniqueOrThrow({ where: { id: sessionId } });
  const settings = await getSettings();
  const expiresAt = new Date(Date.now() + OFFER_WINDOW_MINUTES * 60000);

  const offer = await prisma.$transaction(async (tx) => {
    await tx.waitlistEntry.delete({ where: { id: head.id } });
    return tx.offer.create({
      data: { sessionId, userId: head.userId, expiresAt },
    });
  });
  await reindexWaitlist(sessionId);

  await notifyBoth(
    head.userId,
    `Se ha liberado una plaza · ${session.date} ${session.time} ${session.className}. Tienes ${OFFER_WINDOW_MINUTES} min para confirmarla.`,
    { app: settings.reminderChannelApp, whatsapp: settings.reminderChannelWhatsapp }
  );

  return offer;
}

/** Expires any of this user's offers whose 30-minute window has passed, and
 *  cascades each to the next waitlisted person. Called lazily on every read
 *  that would otherwise show a stale "pending" offer — there's no
 *  background scheduler in this build. */
export async function expireStaleOffers(userId?: string) {
  const stale = await prisma.offer.findMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() }, ...(userId ? { userId } : {}) },
  });
  for (const o of stale) {
    await prisma.offer.update({ where: { id: o.id }, data: { status: 'EXPIRED' } });
    await cascadeToNextWaitlisted(o.sessionId);
  }
}

export async function getPendingOffer(userId: string) {
  await expireStaleOffers(userId);
  return prisma.offer.findFirst({
    where: { userId, status: 'PENDING' },
    include: { session: true },
    orderBy: { createdAt: 'desc' },
  });
}
