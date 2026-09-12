import { Router } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../lib/asyncHandler';
import { badRequest } from '../lib/errors';
import { requireAuth, requireActiveMember, AuthedRequest } from '../middleware/auth';
import { getSessionsForDate, isValidDate, weekDatesContaining, diaLabel, minutesUntil, todayISO, addDays } from '../services/sessions';
import { ensureBono, bonoStatusLabel } from '../services/bonos';
import { getPendingOffer } from '../services/offers';
import { bookSession, cancelBooking, joinWaitlist, leaveWaitlist, acceptOffer, declineOffer, occupiedCount } from '../services/bookings';
import { getSettings } from '../services/settings';

export const memberRouter = Router();
memberRouter.use(requireAuth, requireActiveMember);

const CANCEL_CUTOFF_MINUTES = 6 * 60;

memberRouter.get('/agenda', asyncHandler(async (req: AuthedRequest, res) => {
  const date = String(req.query.date || todayISO());
  if (!isValidDate(date)) throw badRequest('Fecha inválida');
  const userId = req.userId!;

  const [sessions, bono, pendingOffer, settings] = await Promise.all([
    getSessionsForDate(date),
    ensureBono(userId),
    getPendingOffer(userId),
    getSettings(),
  ]);

  const week = weekDatesContaining(date).map((d) => ({ date: d, label: diaLabel(d), num: d.slice(8, 10) }));
  const closed = sessions.length === 0;

  const rows = await Promise.all(sessions.map(async (s) => {
    const myBooking = s.bookings.find((b) => b.userId === userId);
    const myWaitlist = s.waitlist.find((w) => w.userId === userId);
    const occupied = await occupiedCount(s.id);
    const full = occupied >= s.capacity && !myBooking;
    const libres = Math.max(0, s.capacity - occupied);
    return {
      id: s.id,
      time: s.time,
      className: s.className,
      coachName: s.coachName,
      capacity: s.capacity,
      occupied,
      mine: !!myBooking,
      bookingId: myBooking?.id ?? null,
      waitlisted: !!myWaitlist,
      waitlistEntryId: myWaitlist?.id ?? null,
      waitlistPosition: myWaitlist?.position ?? null,
      full,
      estado: myBooking ? 'Reservada' : myWaitlist ? 'En espera' : full ? 'Completa' : 'Libre',
      plazasTxt: myBooking
        ? 'plaza confirmada'
        : myWaitlist
        ? `puesto ${myWaitlist.position} en la lista`
        : full
        ? 'sin plazas'
        : libres === 1 ? '1 plaza libre' : `${libres} plazas libres`,
    };
  }));

  // Tomorrow's reminder banner — mirrors the "1 día antes" studio setting.
  const tomorrow = addDays(date, 1);
  let reminderTomorrow: { time: string; className: string } | null = null;
  if (settings.reminderEnabled) {
    const tmr = await getSessionsForDate(tomorrow);
    const mine = tmr.find((s) => s.bookings.some((b) => b.userId === userId));
    if (mine) reminderTomorrow = { time: mine.time, className: mine.className };
  }

  res.json({
    date, dayLabel: diaLabel(date), closed, week,
    bono: { remaining: bono.remaining, cycleLabel: bono.cycleLabel, status: bonoStatusLabel(bono.remaining) },
    pendingOffer: pendingOffer && {
      id: pendingOffer.id,
      sessionId: pendingOffer.sessionId,
      date: pendingOffer.session.date,
      time: pendingOffer.session.time,
      className: pendingOffer.session.className,
      expiresAt: pendingOffer.expiresAt,
    },
    reminderTomorrow,
    sessions: rows,
  });
}));

memberRouter.get('/bono', asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const bono = await ensureBono(userId);
  const [recentBookings, recentRenewals] = await Promise.all([
    prisma.booking.findMany({ where: { userId }, include: { session: true }, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.bonoRenewal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 4 }),
  ]);
  const movimientos = [
    ...recentBookings.map((b) => ({
      tipo: b.status === 'CANCELLED' ? 'devolucion' : 'consumo',
      titulo: `${b.session.className} · ${b.session.time}`,
      fecha: b.status === 'CANCELLED' ? b.cancelledAt : b.createdAt,
      delta: b.status === 'CANCELLED' ? '+1' : '-1',
    })),
    ...recentRenewals.map((r) => ({
      tipo: 'renovacion',
      titulo: 'Bono renovado por el estudio',
      fecha: r.createdAt,
      delta: `+${r.sessionsAdded}`,
    })),
  ].sort((a, b) => new Date(b.fecha as Date).getTime() - new Date(a.fecha as Date).getTime()).slice(0, 10);

  res.json({
    remaining: bono.remaining,
    cycleLabel: bono.cycleLabel,
    status: bonoStatusLabel(bono.remaining),
    movimientos,
  });
}));

memberRouter.get('/reservas', asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const today = todayISO();
  const [confirmed, waitlist] = await Promise.all([
    prisma.booking.findMany({ where: { userId, status: 'CONFIRMED' }, include: { session: true } }),
    prisma.waitlistEntry.findMany({ where: { userId }, include: { session: { include: { waitlist: true } } } }),
  ]);

  const proximas = confirmed
    .filter((b) => b.session.date >= today)
    .sort((a, b) => (a.session.date + a.session.time).localeCompare(b.session.date + b.session.time))
    .map((b) => {
      const mins = minutesUntil(b.session.date, b.session.time);
      const cancelable = mins >= CANCEL_CUTOFF_MINUTES;
      return {
        bookingId: b.id,
        date: b.session.date,
        dayLabel: `${diaLabel(b.session.date)} ${b.session.date.slice(8, 10)}`,
        time: b.session.time,
        className: b.session.className,
        coachName: b.session.coachName,
        cancelable,
        cancelText: cancelable ? 'Cancelar' : 'No cancelable',
        cancelNote: cancelable ? '' : 'Quedan menos de 6 h · se descuenta del bono',
      };
    });

  const historial = confirmed
    .filter((b) => b.session.date < today)
    .sort((a, b) => (b.session.date + b.session.time).localeCompare(a.session.date + a.session.time))
    .slice(0, 20)
    .map((b) => ({
      date: b.session.date,
      dayLabel: `${diaLabel(b.session.date)} ${b.session.date.slice(8, 10)}`,
      className: `${b.session.className} · ${b.session.time}`,
      estado: 'Asistida',
    }));

  const espera = waitlist.map((w: any) => ({
    entryId: w.id,
    sessionId: w.sessionId,
    date: w.session.date,
    time: w.session.time,
    className: w.session.className,
    position: w.position,
    total: w.session.waitlist?.length ?? w.position,
  }));

  res.json({ proximas, historial, espera });
}));

memberRouter.post('/sessions/:id/book', asyncHandler(async (req: AuthedRequest, res) => {
  const booking = await bookSession(req.userId!, req.params.id);
  res.status(201).json({ bookingId: booking.id });
}));

memberRouter.post('/bookings/:id/cancel', asyncHandler(async (req: AuthedRequest, res) => {
  await cancelBooking(req.params.id, req.userId!, { isAdmin: false });
  res.json({ ok: true });
}));

memberRouter.post('/sessions/:id/waitlist', asyncHandler(async (req: AuthedRequest, res) => {
  const entry = await joinWaitlist(req.userId!, req.params.id);
  res.status(201).json({ entryId: entry.id, position: entry.position });
}));

memberRouter.delete('/waitlist/:id', asyncHandler(async (req: AuthedRequest, res) => {
  await leaveWaitlist(req.params.id, req.userId!, { isAdmin: false });
  res.json({ ok: true });
}));

memberRouter.post('/offers/:id/accept', asyncHandler(async (req: AuthedRequest, res) => {
  const booking = await acceptOffer(req.params.id, req.userId!);
  res.status(201).json({ bookingId: booking.id });
}));

memberRouter.post('/offers/:id/decline', asyncHandler(async (req: AuthedRequest, res) => {
  await declineOffer(req.params.id, req.userId!);
  res.json({ ok: true });
}));
