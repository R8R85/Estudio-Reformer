import bcrypt from 'bcryptjs';
import { prisma } from '../src/db';
import { ensureSessionsForDate, todayISO, addDays } from '../src/services/sessions';

const CLASES: Array<{ time: string; className: string; coachName: string }> = [
  { time: '07:00', className: 'Reformer Flow', coachName: 'Marta' },
  { time: '08:15', className: 'Reformer Básico', coachName: 'Nuria' },
  { time: '09:30', className: 'Reformer Core', coachName: 'Marta' },
  { time: '17:00', className: 'Reformer Básico', coachName: 'Iván' },
  { time: '18:15', className: 'Reformer Flow', coachName: 'Nuria' },
  { time: '19:30', className: 'Reformer Avanzado', coachName: 'Iván' },
  { time: '20:45', className: 'Reformer Stretch', coachName: 'Marta' },
];

async function main() {
  console.log('Seeding Estudio Reformer…');

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      studioName: 'Estudio Reformer',
      location: 'Enguera (Valencia)',
      currentCycleLabel: 'Septiembre 2026',
      nextCycleLabel: 'Octubre 2026',
      reminderEnabled: true,
      reminderChannelApp: true,
      reminderChannelWhatsapp: true,
    },
  });

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@estudioreformer.es' },
    update: {},
    create: {
      name: 'Administración',
      email: 'admin@estudioreformer.es',
      phone: '600 00 00 00',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Monday(1) .. Saturday(6) share the same 7 slots; Sunday(0) gets none —
  // "el estudio no abre los domingos".
  for (let dow = 1; dow <= 6; dow++) {
    for (const c of CLASES) {
      const existing = await prisma.classTemplate.findFirst({ where: { dayOfWeek: dow, time: c.time } });
      if (!existing) {
        await prisma.classTemplate.create({
          data: { dayOfWeek: dow, time: c.time, className: c.className, coachName: c.coachName, capacity: 2 },
        });
      }
    }
  }

  const memberPasswordHash = await bcrypt.hash('socia123', 10);
  type SeedMember = {
    name: string; email: string; phone: string; remaining: number; cycleLabel: string;
    experienciaPrevia: boolean; patologia: boolean; patologiaTexto?: string; createdAt: string;
  };
  const members: SeedMember[] = [
    { name: 'Lucía Ferrer', email: 'lucia.ferrer@correo.com', phone: '600 12 34 56', remaining: 2, cycleLabel: 'Septiembre 2026', experienciaPrevia: true, patologia: true, patologiaTexto: 'Lumbalgia crónica, sin impacto ni flexión profunda', createdAt: '2025-03-12' },
    { name: 'Ana Ruiz', email: 'ana.ruiz@correo.com', phone: '611 22 33 44', remaining: 0, cycleLabel: 'Septiembre 2026', experienciaPrevia: true, patologia: false, createdAt: '2025-01-04' },
    { name: 'Carmen Gil', email: 'carmen.gil@correo.com', phone: '622 55 66 77', remaining: 6, cycleLabel: 'Septiembre 2026', experienciaPrevia: false, patologia: false, createdAt: '2025-06-02' },
    { name: 'Paula Soto', email: 'paula.soto@correo.com', phone: '633 88 99 00', remaining: 0, cycleLabel: 'Septiembre 2026', experienciaPrevia: false, patologia: true, patologiaTexto: 'Operada de rodilla derecha en 2024', createdAt: '2026-02-18' },
    { name: 'Elena Vidal', email: 'elena.vidal@correo.com', phone: '644 10 20 30', remaining: 8, cycleLabel: 'Octubre 2026', experienciaPrevia: true, patologia: false, createdAt: '2025-09-09' },
    { name: 'Rocío Pena', email: 'rocio.pena@correo.com', phone: '655 40 50 60', remaining: 1, cycleLabel: 'Septiembre 2026', experienciaPrevia: true, patologia: false, createdAt: '2024-04-23' },
  ];

  const memberRecords: Record<string, string> = {};
  for (const m of members) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        name: m.name, email: m.email, phone: m.phone, passwordHash: memberPasswordHash,
        role: 'MEMBER', status: 'ACTIVE', approvedAt: new Date(m.createdAt),
        experienciaPrevia: m.experienciaPrevia, patologia: m.patologia, patologiaTexto: m.patologiaTexto ?? null,
        createdAt: new Date(m.createdAt),
      },
    });
    memberRecords[m.name] = user.id;

    const bono = await prisma.bono.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, remaining: m.remaining, cycleLabel: m.cycleLabel },
    });
    const renewalExists = await prisma.bonoRenewal.findFirst({ where: { userId: user.id } });
    if (!renewalExists) {
      await prisma.bonoRenewal.create({ data: { userId: user.id, cycleLabel: m.cycleLabel, sessionsAdded: 8 } });
    }
    void bono;
  }

  // Two pending access requests, matching the studio's approval queue.
  const pendingHash = await bcrypt.hash('pendiente123', 10);
  await prisma.user.upsert({
    where: { email: 'teresa@correo.com' },
    update: {},
    create: {
      name: 'Teresa Bou', email: 'teresa@correo.com', phone: '622 41 08 77', passwordHash: pendingHash,
      role: 'MEMBER', status: 'PENDING', experienciaPrevia: true, patologia: false,
    },
  });
  await prisma.user.upsert({
    where: { email: 'm.died@correo.com' },
    update: {},
    create: {
      name: 'Marcos Died', email: 'm.died@correo.com', phone: '655 90 12 30', passwordHash: pendingHash,
      role: 'MEMBER', status: 'PENDING', experienciaPrevia: false, patologia: true,
      patologiaTexto: 'Hernia discal L4-L5, evitar carga axial',
    },
  });

  // A little booked-in-the-future and attended-in-the-past history for Lucía
  // Ferrer, so the demo agenda/bono/reservas screens have something to show.
  const today = todayISO();
  const lucia = memberRecords['Lucía Ferrer'];
  const luciaRenewal = await prisma.bonoRenewal.findFirst({ where: { userId: lucia }, orderBy: { createdAt: 'desc' } });

  async function bookFor(userId: string, date: string, time: string, renewalId: string | null) {
    await ensureSessionsForDate(date);
    const session = await prisma.classSession.findFirst({ where: { date, time } });
    if (!session) return;
    const already = await prisma.booking.findFirst({ where: { sessionId: session.id, userId } });
    if (already) return;
    await prisma.booking.create({ data: { sessionId: session.id, userId, bonoRenewalId: renewalId } });
  }

  await bookFor(lucia, addDays(today, 2), '18:15', luciaRenewal?.id ?? null);
  await bookFor(lucia, addDays(today, 5), '09:30', luciaRenewal?.id ?? null);
  await bookFor(lucia, addDays(today, -3), '17:00', luciaRenewal?.id ?? null);
  await bookFor(lucia, addDays(today, -5), '08:15', luciaRenewal?.id ?? null);

  // A couple of other members booked into Lucía's upcoming slot so the admin
  // "asistentes" sheet and capacity indicators aren't empty.
  const ana = memberRecords['Ana Ruiz'];
  const anaRenewal = await prisma.bonoRenewal.findFirst({ where: { userId: ana } });
  await bookFor(ana, addDays(today, 2), '18:15', anaRenewal?.id ?? null);

  console.log('Seed completada.');
  console.log('Admin:  admin@estudioreformer.es / admin123');
  console.log('Socia:  lucia.ferrer@correo.com / socia123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
