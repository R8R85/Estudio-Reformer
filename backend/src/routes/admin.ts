import { Router } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../lib/asyncHandler';
import { badRequest, notFound } from '../lib/errors';
import { requireAuth, requireAdmin, AuthedRequest } from '../middleware/auth';
import { validateBody, classTemplateSchema, classTemplatePatchSchema, reminderSettingsSchema } from '../lib/validate';
import { getSessionsForDate, isValidDate, diaLabel, todayISO } from '../services/sessions';
import { ensureBono, renewOne, renewAllPending, pendingRenewalUsers, bonoStatusLabel } from '../services/bonos';
import { cancelBooking, occupiedCount } from '../services/bookings';
import { getSettings, updateSettings, advanceCycle } from '../services/settings';
import { notifyBoth } from '../services/notifications';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

// ── Agenda (admin view: real names, occupancy, quick edit) ─────────────────

adminRouter.get('/agenda', asyncHandler(async (req, res) => {
  const date = String(req.query.date || todayISO());
  if (!isValidDate(date)) throw badRequest('Fecha inválida');
  const sessions = await getSessionsForDate(date);

  const rows = await Promise.all(sessions.map(async (s) => {
    const occupied = await occupiedCount(s.id);
    const pct = s.capacity > 0 ? Math.round((occupied / s.capacity) * 100) : 0;
    return {
      id: s.id,
      templateId: s.templateId,
      time: s.time,
      className: s.className,
      coachName: s.coachName,
      capacity: s.capacity,
      occupied,
      pct,
      vacia: occupied === 0,
      attendeeNames: s.bookings.map((b) => b.user.name),
      waitlistCount: s.waitlist.length,
    };
  }));

  res.json({ date, dayLabel: diaLabel(date), closed: sessions.length === 0, sessions: rows });
}));

adminRouter.get('/sessions/:id/attendees', asyncHandler(async (req, res) => {
  const session = await prisma.classSession.findUnique({
    where: { id: req.params.id },
    include: {
      bookings: { where: { status: 'CONFIRMED' }, include: { user: { include: { bono: true } } } },
      waitlist: { orderBy: { position: 'asc' }, include: { user: true } },
    },
  });
  if (!session) throw notFound('Sesión no encontrada');
  res.json({
    session: { id: session.id, templateId: session.templateId, date: session.date, time: session.time, className: session.className, coachName: session.coachName, capacity: session.capacity },
    attendees: session.bookings.map((b) => ({
      bookingId: b.id,
      userId: b.userId,
      nombre: b.user.name,
      iniciales: initials(b.user.name),
      bonoTxt: b.user.bono ? `${Math.min(8, b.user.bono.remaining)}/8 disponibles` : '—',
    })),
    espera: session.waitlist.map((w) => ({ entryId: w.id, nombre: w.user.name, position: w.position })),
  });
}));

adminRouter.post('/bookings/:id/release', asyncHandler(async (req: AuthedRequest, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) throw notFound('Reserva no encontrada');
  await cancelBooking(req.params.id, booking.userId, { isAdmin: true });
  res.json({ ok: true });
}));

// ── Class templates (franjas) ───────────────────────────────────────────────

adminRouter.get('/class-templates', asyncHandler(async (_req, res) => {
  const templates = await prisma.classTemplate.findMany({ orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }] });
  res.json({ templates });
}));

adminRouter.post('/class-templates', validateBody(classTemplateSchema), asyncHandler(async (req, res) => {
  const template = await prisma.classTemplate.create({ data: req.body });
  res.status(201).json({ template });
}));

adminRouter.put('/class-templates/:id', validateBody(classTemplatePatchSchema), asyncHandler(async (req, res) => {
  const template = await prisma.classTemplate.update({ where: { id: req.params.id }, data: req.body }).catch(() => null);
  if (!template) throw notFound('Franja no encontrada');
  res.json({ template });
}));

adminRouter.delete('/class-templates/:id', asyncHandler(async (req, res) => {
  // Deleting a template only stops future dates from materializing new
  // sessions for it — sessions (and any bookings) already created for past
  // or already-viewed dates are left alone, same as editing one.
  await prisma.classTemplate.delete({ where: { id: req.params.id } }).catch(() => null);
  res.json({ ok: true });
}));

// ── Access requests ─────────────────────────────────────────────────────────

adminRouter.get('/access-requests', asyncHandler(async (_req, res) => {
  const requests = await prisma.user.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
  res.json({
    requests: requests.map((u) => ({
      id: u.id,
      nombre: u.name,
      iniciales: initials(u.name),
      contacto: `${u.email} · ${u.phone}`,
      nota: `${u.experienciaPrevia ? 'Ha hecho reformer antes' : 'Sin experiencia previa'}`
        + (u.patologia ? ` · Limitación: ${u.patologiaTexto || 'sin detallar'}` : '')
        + ` · solicitada el ${u.createdAt.toISOString().slice(0, 10)}`,
    })),
  });
}));

adminRouter.post('/access-requests/:id/approve', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user || user.status !== 'PENDING') throw notFound('Solicitud no encontrada');
  await prisma.user.update({ where: { id: user.id }, data: { status: 'ACTIVE', approvedAt: new Date() } });
  await ensureBono(user.id);
  const settings = await getSettings();
  await notifyBoth(user.id, 'Tu acceso ha sido aprobado. La administración te asignará un bono de 8 sesiones.', {
    app: settings.reminderChannelApp, whatsapp: settings.reminderChannelWhatsapp,
  });
  res.json({ ok: true });
}));

adminRouter.post('/access-requests/:id/reject', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user || user.status !== 'PENDING') throw notFound('Solicitud no encontrada');
  await prisma.user.update({ where: { id: user.id }, data: { status: 'REJECTED', rejectedAt: new Date() } });
  res.json({ ok: true });
}));

// ── Members directory + ficha ───────────────────────────────────────────────

adminRouter.get('/members', asyncHandler(async (req, res) => {
  const q = String(req.query.query || '').trim().toLowerCase();
  const members = await prisma.user.findMany({
    where: { status: 'ACTIVE', role: 'MEMBER', ...(q ? { name: { contains: q } } : {}) },
    include: { bono: true },
    orderBy: { name: 'asc' },
  });
  const settings = await getSettings();
  res.json({
    members: members.map((u) => {
      const sinBono = !u.bono || u.bono.cycleLabel === 'Sin bono';
      const pend = !u.bono || u.bono.cycleLabel !== settings.nextCycleLabel;
      return {
        id: u.id,
        nombre: u.name,
        iniciales: initials(u.name),
        detalle: sinBono ? 'Sin bono asignado' : `${u.bono!.remaining} sesiones disponibles · ${u.bono!.cycleLabel}`,
        pendienteRenovar: pend,
        btnTexto: pend ? (sinBono ? 'Asignar bono' : 'Renovar') : 'Al día',
      };
    }),
  });
}));

adminRouter.get('/members/:id', asyncHandler(async (req, res) => {
  const u = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      bono: true,
      renewals: {
        orderBy: { createdAt: 'desc' },
        include: { bookings: { where: { status: 'CONFIRMED' }, include: { session: true } } },
      },
    },
  });
  if (!u) throw notFound('Socio/a no encontrado/a');

  const totalContratados = u.renewals.length;
  const sinBono = !u.bono || u.bono.cycleLabel === 'Sin bono';

  res.json({
    id: u.id,
    nombre: u.name,
    iniciales: initials(u.name),
    email: u.email,
    tel: u.phone,
    alta: `Alta: ${u.createdAt.toISOString().slice(0, 10)}`,
    estadoBono: sinBono ? 'Sin bono' : u.bono!.cycleLabel,
    experiencia: u.experienciaPrevia ? 'Ha hecho reformer antes' : 'Sin experiencia previa',
    patologia: u.patologia ? 'Con patología que limita la actividad' : 'Sin patología declarada',
    hayLimitacion: u.patologia,
    limitacion: u.patologiaTexto || 'Sin detallar',
    resumen: sinBono
      ? `Sin bono asignado · ${totalContratados} bonos contratados`
      : `${u.bono!.remaining} sesiones disponibles · ${totalContratados} bonos contratados`,
    bonos: u.renewals.map((r) => ({
      mes: r.cycleLabel,
      resumen: `${r.bookings.length} sesiones disfrutadas`,
      sesiones: r.bookings
        .sort((a, b) => (b.session.date + b.session.time).localeCompare(a.session.date + a.session.time))
        .map((b) => ({ fecha: b.session.date, clase: `${b.session.className} · ${b.session.time}` })),
      vacio: r.bookings.length === 0,
    })),
  });
}));

adminRouter.post('/members/:id/renew', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user || user.status !== 'ACTIVE') throw notFound('Socio/a no encontrado/a');
  await renewOne(user.id);
  res.json({ ok: true });
}));

// ── Bonos overview + bulk renewal ───────────────────────────────────────────

adminRouter.get('/bonos/summary', asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  const [totalActive, pending] = await Promise.all([
    prisma.user.count({ where: { status: 'ACTIVE', role: 'MEMBER' } }),
    pendingRenewalUsers(),
  ]);
  res.json({
    cicloActual: settings.currentCycleLabel,
    cicloSiguiente: settings.nextCycleLabel,
    numPendientes: pending.length,
    numRenovados: totalActive - pending.length,
    pendientes: pending.map((u) => ({
      id: u.id,
      nombre: u.name,
      detalle: !u.bono || u.bono.cycleLabel === 'Sin bono' ? 'Sin bono asignado' : `${u.bono.remaining} sesiones disponibles · ${u.bono.cycleLabel}`,
    })),
  });
}));

adminRouter.post('/bonos/renew-all', asyncHandler(async (_req, res) => {
  const n = await renewAllPending();
  res.json({ renovados: n });
}));

adminRouter.post('/cycle/advance', asyncHandler(async (_req, res) => {
  const settings = await advanceCycle();
  res.json({ settings });
}));

// ── Reminder settings ────────────────────────────────────────────────────────

adminRouter.get('/settings/reminders', asyncHandler(async (_req, res) => {
  const s = await getSettings();
  res.json({
    reminderEnabled: s.reminderEnabled,
    reminderChannelApp: s.reminderChannelApp,
    reminderChannelWhatsapp: s.reminderChannelWhatsapp,
  });
}));

adminRouter.put('/settings/reminders', validateBody(reminderSettingsSchema), asyncHandler(async (req, res) => {
  const s = await updateSettings(req.body);
  res.json({
    reminderEnabled: s.reminderEnabled,
    reminderChannelApp: s.reminderChannelApp,
    reminderChannelWhatsapp: s.reminderChannelWhatsapp,
  });
}));

// ── Notification outbox (visibility into the stubbed WhatsApp/push sends) ──

adminRouter.get('/notifications', asyncHandler(async (_req, res) => {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: true },
  });
  res.json({
    notifications: notifications.map((n) => ({
      id: n.id, channel: n.channel, message: n.message, createdAt: n.createdAt, destinatario: n.user.name,
    })),
  });
}));
