import { prisma } from '../db';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors';
import { minutesUntil } from './sessions';
import { cascadeToNextWaitlisted, expireStaleOffers } from './offers';

const CANCEL_CUTOFF_MINUTES = 6 * 60;

/** Confirmed bookings + still-live offers both hold a seat, so a freed spot
 *  under active offer doesn't look "available" to everyone else while its
 *  30-minute window is running. */
export async function occupiedCount(tenantId: string, sessionId: string): Promise<number> {
  const [confirmed, offers] = await Promise.all([
    prisma.booking.count({ where: { tenantId, sessionId, status: 'CONFIRMED' } }),
    prisma.offer.count({ where: { tenantId, sessionId, status: 'PENDING' } }),
  ]);
  return confirmed + offers;
}

export async function bookSession(tenantId: string, userId: string, sessionId: string) {
  const session = await prisma.classSession.findUnique({ where: { id: sessionId } });
  if (!session || session.tenantId !== tenantId) throw notFound('La sesión ya no existe');

  const already = await prisma.booking.findFirst({ where: { tenantId, sessionId, userId, status: 'CONFIRMED' } });
  if (already) throw conflict('Ya tienes esta sesión reservada');

  const bono = await prisma.bono.findUnique({ where: { userId } });
  if (!bono || bono.remaining <= 0) {
    throw conflict('No te quedan sesiones en el bono. Habla con el estudio para renovarlo.');
  }

  const occupied = await occupiedCount(tenantId, sessionId);
  if (occupied >= session.capacity) throw conflict('Sesión completa · apúntate a la lista de espera');

  const latestRenewal = await prisma.bonoRenewal.findFirst({ where: { tenantId, userId }, orderBy: { createdAt: 'desc' } });

  const [booking] = await prisma.$transaction([
    prisma.booking.create({
      data: { tenantId, sessionId, userId, bonoRenewalId: latestRenewal?.id ?? null },
    }),
    prisma.bono.update({ where: { userId }, data: { remaining: { decrement: 1 } } }),
  ]);
  return booking;
}

export async function cancelBooking(tenantId: string, bookingId: string, requesterId: string, opts: { isAdmin: boolean }) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { session: true } });
  if (!booking || booking.tenantId !== tenantId) throw notFound('Reserva no encontrada');
  if (!opts.isAdmin && booking.userId !== requesterId) throw forbidden('Esta reserva no es tuya');
  if (booking.status !== 'CONFIRMED') throw conflict('Esta reserva ya no está activa');

  if (!opts.isAdmin) {
    const mins = minutesUntil(booking.session.date, booking.session.time);
    if (mins < CANCEL_CUTOFF_MINUTES) {
      throw conflict('No se puede cancelar con menos de 6 h de antelación · la sesión se descuenta del bono');
    }
  }

  await prisma.$transaction([
    prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date() } }),
    prisma.bono.update({ where: { userId: booking.userId }, data: { remaining: { increment: 1 } } }),
  ]);

  await cascadeToNextWaitlisted(tenantId, booking.sessionId);
  return booking;
}

export async function joinWaitlist(tenantId: string, userId: string, sessionId: string) {
  await expireStaleOffers(tenantId, userId);
  const session = await prisma.classSession.findUnique({ where: { id: sessionId } });
  if (!session || session.tenantId !== tenantId) throw notFound('La sesión ya no existe');

  const existing = await prisma.waitlistEntry.findUnique({ where: { sessionId_userId: { sessionId, userId } } });
  if (existing) throw conflict('Ya estás en la lista de espera de esta sesión');

  const alreadyBooked = await prisma.booking.findFirst({ where: { tenantId, sessionId, userId, status: 'CONFIRMED' } });
  if (alreadyBooked) throw conflict('Ya tienes plaza en esta sesión');

  const count = await prisma.waitlistEntry.count({ where: { tenantId, sessionId } });
  return prisma.waitlistEntry.create({ data: { tenantId, sessionId, userId, position: count + 1 } });
}

export async function leaveWaitlist(tenantId: string, entryId: string, userId: string, opts: { isAdmin: boolean }) {
  const entry = await prisma.waitlistEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.tenantId !== tenantId) throw notFound('No estabas en esa lista de espera');
  if (!opts.isAdmin && entry.userId !== userId) throw forbidden('Esa lista de espera no es tuya');
  await prisma.waitlistEntry.delete({ where: { id: entryId } });
  const rest = await prisma.waitlistEntry.findMany({ where: { tenantId, sessionId: entry.sessionId }, orderBy: { position: 'asc' } });
  await Promise.all(rest.map((e, i) => (e.position === i + 1 ? null : prisma.waitlistEntry.update({ where: { id: e.id }, data: { position: i + 1 } }))));
  return entry;
}

export async function acceptOffer(tenantId: string, offerId: string, userId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer || offer.tenantId !== tenantId || offer.userId !== userId) throw notFound('Oferta no encontrada');
  if (offer.status !== 'PENDING') throw conflict('Esta oferta ya no está disponible');
  if (offer.expiresAt.getTime() < Date.now()) {
    await prisma.offer.update({ where: { id: offerId }, data: { status: 'EXPIRED' } });
    await cascadeToNextWaitlisted(tenantId, offer.sessionId);
    throw conflict('La oferta ha caducado · se ha ofrecido a la siguiente persona en la lista');
  }

  const bono = await prisma.bono.findUnique({ where: { userId } });
  if (!bono || bono.remaining <= 0) {
    throw conflict('No te quedan sesiones en el bono. Habla con el estudio para renovarlo.');
  }

  const latestRenewal = await prisma.bonoRenewal.findFirst({ where: { tenantId, userId }, orderBy: { createdAt: 'desc' } });
  const [booking] = await prisma.$transaction([
    prisma.booking.create({ data: { tenantId, sessionId: offer.sessionId, userId, bonoRenewalId: latestRenewal?.id ?? null } }),
    prisma.bono.update({ where: { userId }, data: { remaining: { decrement: 1 } } }),
    prisma.offer.update({ where: { id: offerId }, data: { status: 'ACCEPTED' } }),
  ]);
  return booking;
}

export async function declineOffer(tenantId: string, offerId: string, userId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer || offer.tenantId !== tenantId || offer.userId !== userId) throw notFound('Oferta no encontrada');
  if (offer.status !== 'PENDING') throw conflict('Esta oferta ya no está disponible');
  await prisma.offer.update({ where: { id: offerId }, data: { status: 'DECLINED' } });
  await cascadeToNextWaitlisted(tenantId, offer.sessionId);
  return offer;
}

export function assertHora(hora: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) throw badRequest('Hora inválida');
}
