import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import NexoMark3D from '../components/NexoMark3D';
import { Badge, Button, Card, Reveal } from '../components/ui';

const FEATURES = [
  {
    title: 'Agenda por franjas',
    desc: 'Horario semanal recurrente editable por la administración: hora, clase, instructor/a y aforo. Las sesiones concretas se generan solas al abrir cada fecha.',
    tag: 'Configurable',
  },
  {
    title: 'Bono sin caducidad',
    desc: 'Crédito de 8 sesiones que nunca se resetea — se suma al renovar, nunca se pierde lo que no se usa. El ciclo "actual / siguiente" es un rótulo editable, no una fecha fija.',
    tag: 'Configurable',
  },
  {
    title: 'Lista de espera automática',
    desc: 'Si una sesión está llena, la socia entra en espera. Al liberarse una plaza, se ofrece a la primera de la lista con 30 minutos para confirmar antes de pasar a la siguiente.',
    tag: 'Automático',
  },
  {
    title: 'Alta con revisión',
    desc: 'Cada solicitud de acceso pasa por la administración antes de ver la agenda: nombre, contacto, experiencia previa y limitaciones físicas.',
    tag: 'Seguridad',
  },
  {
    title: 'Recordatorios configurables',
    desc: 'El aviso del día anterior puede activarse o desactivarse, y elegir canal: dentro de la app, por WhatsApp, o ambos — por estudio.',
    tag: 'Configurable',
  },
  {
    title: 'Ficha privada de socia',
    desc: 'Nombre e historial de sesiones solo visibles para la administración de ese estudio. Las demás socias solo ven plazas libres, nunca nombres ni datos de salud.',
    tag: 'Privacidad',
  },
];

const PLANS = [
  {
    name: 'Solo', price: '45', period: '/mes', featured: false,
    desc: 'Un estudio, una sede, hasta 60 socias activas',
    items: ['Agenda, bonos y reservas completos', 'Lista de espera con oferta automática', 'Recordatorio en la app'],
    missing: ['Recordatorio por WhatsApp', 'Varias sedes'],
  },
  {
    name: 'Estudio', price: '99', period: '/mes', featured: true,
    desc: 'Hasta 200 socias activas, una sede',
    items: ['Todo lo de Solo', 'Recordatorio y lista de espera por WhatsApp', 'Ficha de socia con histórico', 'Exportación de datos (CSV)'],
    missing: ['Varias sedes'],
  },
  {
    name: 'Cadena', price: '249', period: '/mes', featured: false,
    desc: 'Varias sedes bajo una misma administración',
    items: ['Todo lo de Estudio, por sede', 'Roles de administración por sede', 'Panel consolidado entre sedes', 'Gestor de cuenta asignado'],
    missing: [],
  },
];

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-line/60 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">
          NEXO<span className="text-ink-muted font-medium">ESTUDIO</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-ink-muted md:flex">
          <a href="#funciones" className="hover:text-ink">Funciones</a>
          <a href="#precios" className="hover:text-ink">Precios</a>
          <a href="#seguridad" className="hover:text-ink">Seguridad</a>
        </div>
        <div className="flex items-center gap-3">
          <Button to="/login" kind="secondary" className="!px-5 !py-2 text-sm">Entrar</Button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-16 pb-24 md:pt-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          <Reveal>
            <Badge>Software multi-estudio</Badge>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              El nexo entre tu estudio de pilates y sus socias.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-muted">
              Agenda, bonos, lista de espera y administración — una sola plataforma para
              cuantos estudios de reformer la usen, cada uno con su propio código de acceso,
              sus propios límites de plan y sus propios datos, completamente aislados.
            </p>
          </Reveal>
          <Reveal delay={0.24} className="mt-9 flex flex-wrap gap-4">
            <Button to="/login" className="!px-7 !py-3.5">Entrar al panel</Button>
            <Button href="#funciones" kind="secondary" className="!px-7 !py-3.5">Ver funciones</Button>
          </Reveal>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto aspect-square w-full max-w-md"
        >
          <NexoMark3D className="h-full w-full" />
        </motion.div>
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section id="funciones" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-display text-sm font-medium uppercase tracking-widest text-accent">Funciones</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Todo lo que un estudio necesita para llevar su agenda — y ajustar a su manera.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <Card hover className="h-full">
                <Badge tone={f.tag === 'Configurable' ? 'accent' : f.tag === 'Automático' ? 'good' : f.tag === 'Seguridad' ? 'warn' : 'accent'}>{f.tag}</Badge>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.desc}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function RolesSection() {
  const roles = [
    { name: 'Socias', desc: 'Reservan desde la web o el móvil, ven su bono y su lista de espera, cancelan con margen de 6 h.', to: '/login' },
    { name: 'Administración', desc: 'Gestiona franjas, aprueba altas, renueva bonos, configura recordatorios y revisa la facturación — todo desde el mismo panel web.', to: '/login' },
  ];
  return (
    <section className="bg-surface-2 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-display text-sm font-medium uppercase tracking-widest text-accent">Acceso</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Un panel real, no solo una app para mirar.
          </h2>
          <p className="mt-4 max-w-2xl text-ink-muted">
            Con el código de tu estudio y tus credenciales, la gestión se hace desde aquí mismo —
            sin instalar nada. Las apps nativas de iOS y Android usan la misma cuenta.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {roles.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.1}>
              <Card className="flex h-full flex-col justify-between" hover>
                <div>
                  <h3 className="font-display text-xl font-semibold">{r.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">{r.desc}</p>
                </div>
                <Button to={r.to} kind="secondary" className="mt-6 self-start">Entrar como {r.name.toLowerCase()}</Button>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="precios" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-display text-sm font-medium uppercase tracking-widest text-accent">Precios</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Tres planes. Los límites son reales, no solo una promesa de venta.
          </h2>
          <p className="mt-4 max-w-2xl text-ink-muted">
            El número de socias, el canal de WhatsApp y el soporte multi-sede se leen del plan de
            cada estudio en el propio backend — subir de plan cambia el límite al instante.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <Card
                hover
                className={`flex h-full flex-col gap-5 ${p.featured ? '!border-accent/40 ring-1 ring-accent/30' : ''}`}
              >
                {p.featured && <Badge>Más elegido</Badge>}
                <div>
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{p.desc}</p>
                </div>
                <div className="flex items-baseline gap-1 font-display">
                  <span className="text-4xl font-semibold">{p.price}€</span>
                  <span className="text-sm text-ink-muted">{p.period}</span>
                </div>
                <hr className="border-line" />
                <ul className="flex flex-1 flex-col gap-2.5 text-sm">
                  {p.items.map((it) => (
                    <li key={it} className="flex gap-2"><span className="text-good">✓</span><span>{it}</span></li>
                  ))}
                  {p.missing.map((it) => (
                    <li key={it} className="flex gap-2 text-ink-faint"><span>–</span><span>{it}</span></li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  const points = [
    { title: 'Aislamiento por fila', desc: 'Cada estudio, socia, franja y reserva lleva su propio identificador de estudio — ninguna consulta cruza de un cliente a otro.' },
    { title: 'Código de estudio', desc: 'El alta y el inicio de sesión piden el código del estudio antes que el email: imposible entrar en los datos de otro por error.' },
    { title: 'Dato de salud protegido', desc: 'La patología declarada en el alta solo la ve la administración del propio estudio — nunca otras socias, nunca otro estudio.' },
  ];
  return (
    <section id="seguridad" className="bg-ink px-6 py-24 text-bg">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-display text-sm font-medium uppercase tracking-widest text-accent-soft/80">Seguridad</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-bg md:text-4xl">
            Una plataforma, muchos estudios — sin que se mezclen entre ellos.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {points.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="rounded-xl2 border border-white/10 bg-white/5 p-6">
                <h3 className="font-display text-lg font-semibold text-bg">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-bg/70">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-6 py-24">
      <Reveal className="mx-auto max-w-4xl rounded-xl2 border border-accent/30 bg-accent-soft p-10 text-center md:p-16">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          ¿Tu estudio ya tiene cuenta?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-ink-muted">
          Entra con el código de tu estudio para gestionar la agenda, los bonos y las altas — o solicita acceso si eres nueva socia.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button to="/login">Iniciar sesión</Button>
          <Button to="/registro" kind="secondary">Solicitar acceso</Button>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line px-6 py-10 text-xs text-ink-faint">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} NEXOESTUDIO</span>
        <span>Multi-estudio · Agenda · Bonos · Lista de espera · Facturación</span>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div>
      <Nav />
      <Hero />
      <FeatureSection />
      <RolesSection />
      <PricingSection />
      <SecuritySection />
      <CTASection />
      <Footer />
    </div>
  );
}
