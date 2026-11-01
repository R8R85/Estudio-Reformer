import bcrypt from 'bcryptjs';
import { prisma } from '../src/db';
import { ensureSessionsForDate, todayISO, addDays } from '../src/services/sessions';
import { PLAN_LIMITS } from '../src/services/billing';

const CLASES: Array<{ time: string; className: string; coachName: string }> = [
  { time: '07:00', className: 'Reformer Flow', coachName: 'Marta' },
  { time: '08:15', className: 'Reformer Básico', coachName: 'Nuria' },
  { time: '09:30', className: 'Reformer Core', coachName: 'Marta' },
  { time: '17:00', className: 'Reformer Básico', coachName: 'Iván' },
  { time: '18:15', className: 'Reformer Flow', coachName: 'Nuria' },
  { time: '19:30', className: 'Reformer Avanzado', coachName: 'Iván' },
  { time: '20:45', className: 'Reformer Stretch', coachName: 'Marta' },
];

/** Seeds one full demo studio (tenant + admin + franjas + members + a bit of
 *  booking history) under its own "código de estudio". Called twice, with
 *  two different tenants, so the demo data doubles as an isolation test:
 *  anything that leaked across tenants would show up as cross-contamination
 *  between these two studios' agendas/members/bonos. */
async function seedTenant(opts: {
  code: string;
  name: string;
  location: string;
  plan: keyof typeof PLAN_LIMITS;
  adminEmail: string;
  adminPasswordPlain: string;
  memberPasswordPlain: string;
  members: Array<{
    name: string; email: string; phone: string; remaining: number; cycleLabel: string;
    experienciaPrevia: boolean; patologia: boolean; patologiaTexto?: string; createdAt: string;
  }>;
  pending: Array<{ name: string; email: string; phone: string; experienciaPrevia: boolean; patologia: boolean; patologiaTexto?: string }>;
}) {
  const limits = PLAN_LIMITS[opts.plan];
  const tenant = await prisma.tenant.upsert({
    where: { code: opts.code },
    update: {},
    create: {
      code: opts.code,
      name: opts.name,
      location: opts.location,
      currentCycleLabel: 'Septiembre 2026',
      nextCycleLabel: 'Octubre 2026',
      reminderEnabled: true,
      reminderChannelApp: true,
      reminderChannelWhatsapp: true,
      plan: opts.plan,
      planMemberLimit: limits.memberLimit,
      planWhatsappEnabled: limits.whatsappEnabled,
      planMultiSede: limits.multiSede,
      subscriptionStatus: opts.plan === 'TRIAL' ? 'trialing' : 'active',
    },
  });
  const tenantId = tenant.id;

  const adminPasswordHash = await bcrypt.hash(opts.adminPasswordPlain, 10);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: opts.adminEmail } },
    update: {},
    create: {
      tenantId, name: 'Administración', email: opts.adminEmail, phone: '600 00 00 00',
      passwordHash: adminPasswordHash, role: 'ADMIN', status: 'ACTIVE', approvedAt: new Date(),
    },
  });

  // Monday(1) .. Saturday(6) share the same 7 slots; Sunday(0) gets none —
  // "el estudio no abre los domingos".
  for (let dow = 1; dow <= 6; dow++) {
    for (const c of CLASES) {
      const existing = await prisma.classTemplate.findFirst({ where: { tenantId, dayOfWeek: dow, time: c.time } });
      if (!existing) {
        await prisma.classTemplate.create({
          data: { tenantId, dayOfWeek: dow, time: c.time, className: c.className, coachName: c.coachName, capacity: 2 },
        });
      }
    }
  }

  const memberPasswordHash = await bcrypt.hash(opts.memberPasswordPlain, 10);
  const memberRecords: Record<string, string> = {};
  for (const m of opts.members) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: m.email } },
      update: {},
      create: {
        tenantId, name: m.name, email: m.email, phone: m.phone, passwordHash: memberPasswordHash,
        role: 'MEMBER', status: 'ACTIVE', approvedAt: new Date(m.createdAt),
        experienciaPrevia: m.experienciaPrevia, patologia: m.patologia, patologiaTexto: m.patologiaTexto ?? null,
        createdAt: new Date(m.createdAt),
      },
    });
    memberRecords[m.name] = user.id;

    await prisma.bono.upsert({
      where: { userId: user.id },
      update: {},
      create: { tenantId, userId: user.id, remaining: m.remaining, cycleLabel: m.cycleLabel },
    });
    const renewalExists = await prisma.bonoRenewal.findFirst({ where: { userId: user.id } });
    if (!renewalExists) {
      await prisma.bonoRenewal.create({ data: { tenantId, userId: user.id, cycleLabel: m.cycleLabel, sessionsAdded: 8 } });
    }
  }

  const pendingHash = await bcrypt.hash('pendiente123', 10);
  for (const p of opts.pending) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: p.email } },
      update: {},
      create: {
        tenantId, name: p.name, email: p.email, phone: p.phone, passwordHash: pendingHash,
        role: 'MEMBER', status: 'PENDING', experienciaPrevia: p.experienciaPrevia, patologia: p.patologia,
        patologiaTexto: p.patologiaTexto ?? null,
      },
    });
  }

  return { tenantId, memberRecords };
}

async function main() {
  console.log('Seeding NEXO (2 tenants, para probar aislamiento)…');

  // ── Platform admin — the vendor's own operator, not scoped to any tenant.
  // tenantId: null isn't covered by the @@unique([tenantId, email]) index
  // (NULL never equals NULL in a unique constraint), so this is a plain
  // find-or-create rather than an upsert.
  const platformExists = await prisma.user.findFirst({ where: { tenantId: null, email: 'platform@nexo.app' } });
  if (!platformExists) {
    const platformPasswordHash = await bcrypt.hash('platform123', 10);
    await prisma.user.create({
      data: {
        tenantId: null, name: 'Equipo NEXO', email: 'platform@nexo.app', phone: '600 00 00 01',
        passwordHash: platformPasswordHash, role: 'PLATFORM_ADMIN', status: 'ACTIVE', approvedAt: new Date(),
      },
    });
  }

  // ── Tenant 1: Estudio Reformer (Enguera) — the original single-tenant demo data.
  const t1 = await seedTenant({
    code: 'ENGUERA',
    name: 'Estudio Reformer',
    location: 'Enguera (Valencia)',
    plan: 'ESTUDIO',
    adminEmail: 'admin@estudioreformer.es',
    adminPasswordPlain: 'admin123',
    memberPasswordPlain: 'socia123',
    members: [
      { name: 'Lucía Ferrer', email: 'lucia.ferrer@correo.com', phone: '600 12 34 56', remaining: 2, cycleLabel: 'Septiembre 2026', experienciaPrevia: true, patologia: true, patologiaTexto: 'Lumbalgia crónica, sin impacto ni flexión profunda', createdAt: '2025-03-12' },
      { name: 'Ana Ruiz', email: 'ana.ruiz@correo.com', phone: '611 22 33 44', remaining: 0, cycleLabel: 'Septiembre 2026', experienciaPrevia: true, patologia: false, createdAt: '2025-01-04' },
      { name: 'Carmen Gil', email: 'carmen.gil@correo.com', phone: '622 55 66 77', remaining: 6, cycleLabel: 'Septiembre 2026', experienciaPrevia: false, patologia: false, createdAt: '2025-06-02' },
      { name: 'Paula Soto', email: 'paula.soto@correo.com', phone: '633 88 99 00', remaining: 0, cycleLabel: 'Septiembre 2026', experienciaPrevia: false, patologia: true, patologiaTexto: 'Operada de rodilla derecha en 2024', createdAt: '2026-02-18' },
      { name: 'Elena Vidal', email: 'elena.vidal@correo.com', phone: '644 10 20 30', remaining: 8, cycleLabel: 'Octubre 2026', experienciaPrevia: true, patologia: false, createdAt: '2025-09-09' },
      { name: 'Rocío Pena', email: 'rocio.pena@correo.com', phone: '655 40 50 60', remaining: 1, cycleLabel: 'Septiembre 2026', experienciaPrevia: true, patologia: false, createdAt: '2024-04-23' },
    ],
    pending: [
      { name: 'Teresa Bou', email: 'teresa@correo.com', phone: '622 41 08 77', experienciaPrevia: true, patologia: false },
      { name: 'Marcos Died', email: 'm.died@correo.com', phone: '655 90 12 30', experienciaPrevia: false, patologia: true, patologiaTexto: 'Hernia discal L4-L5, evitar carga axial' },
    ],
  });

  // ── Tenant 2: a second, unrelated studio — same app, different data, so any
  // leak between tenants (wrong agenda, wrong member list, wrong bono) is
  // immediately visible by comparing the two.
  const t2 = await seedTenant({
    code: 'VALENCIA',
    name: 'Pilates Studio Valencia Centro',
    location: 'Valencia',
    plan: 'SOLO',
    adminEmail: 'admin@pilatesvalencia.es',
    adminPasswordPlain: 'admin123',
    memberPasswordPlain: 'socia123',
    members: [
      { name: 'Marc Esteve', email: 'marc.esteve@correo.com', phone: '700 11 22 33', remaining: 4, cycleLabel: 'Septiembre 2026', experienciaPrevia: true, patologia: false, createdAt: '2025-05-10' },
      { name: 'Irene Campos', email: 'irene.campos@correo.com', phone: '700 44 55 66', remaining: 0, cycleLabel: 'Septiembre 2026', experienciaPrevia: false, patologia: false, createdAt: '2025-11-01' },
    ],
    pending: [
      { name: 'Sofía Llorens', email: 'sofia.llorens@correo.com', phone: '700 77 88 99', experienciaPrevia: false, patologia: false },
    ],
  });

  // A little booked-in-the-future and attended-in-the-past history for one
  // member per tenant, so the demo agenda/bono/reservas screens aren't empty.
  async function bookFor(tenantId: string, userId: string, date: string, time: string, renewalId: string | null) {
    await ensureSessionsForDate(tenantId, date);
    const session = await prisma.classSession.findFirst({ where: { tenantId, date, time } });
    if (!session) return;
    const already = await prisma.booking.findFirst({ where: { tenantId, sessionId: session.id, userId } });
    if (already) return;
    await prisma.booking.create({ data: { tenantId, sessionId: session.id, userId, bonoRenewalId: renewalId } });
  }

  const today = todayISO();

  const lucia = t1.memberRecords['Lucía Ferrer'];
  const luciaRenewal = await prisma.bonoRenewal.findFirst({ where: { userId: lucia }, orderBy: { createdAt: 'desc' } });
  await bookFor(t1.tenantId, lucia, addDays(today, 2), '18:15', luciaRenewal?.id ?? null);
  await bookFor(t1.tenantId, lucia, addDays(today, 5), '09:30', luciaRenewal?.id ?? null);
  await bookFor(t1.tenantId, lucia, addDays(today, -3), '17:00', luciaRenewal?.id ?? null);
  await bookFor(t1.tenantId, lucia, addDays(today, -5), '08:15', luciaRenewal?.id ?? null);

  const ana = t1.memberRecords['Ana Ruiz'];
  const anaRenewal = await prisma.bonoRenewal.findFirst({ where: { userId: ana } });
  await bookFor(t1.tenantId, ana, addDays(today, 2), '18:15', anaRenewal?.id ?? null);

  const marc = t2.memberRecords['Marc Esteve'];
  const marcRenewal = await prisma.bonoRenewal.findFirst({ where: { userId: marc }, orderBy: { createdAt: 'desc' } });
  await bookFor(t2.tenantId, marc, addDays(today, 1), '07:00', marcRenewal?.id ?? null);
  await bookFor(t2.tenantId, marc, addDays(today, -2), '19:30', marcRenewal?.id ?? null);

  console.log('Seed completada.');
  console.log('Plataforma: platform@nexo.app / platform123');
  console.log('—');
  console.log('Estudio 1 · código ENGUERA · Estudio Reformer (Enguera, Valencia)');
  console.log('  Admin: admin@estudioreformer.es / admin123');
  console.log('  Socia: lucia.ferrer@correo.com / socia123');
  console.log('—');
  console.log('Estudio 2 · código VALENCIA · Pilates Studio Valencia Centro');
  console.log('  Admin: admin@pilatesvalencia.es / admin123');
  console.log('  Socio: marc.esteve@correo.com / socia123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
