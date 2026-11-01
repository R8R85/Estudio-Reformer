import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui';
import NexoMark3D from '../components/NexoMark3D';

export default function Pending() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="h-40 w-40">
        <NexoMark3D className="h-full w-full" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
        <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">Solicitud en revisión</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-muted">
          {user?.name ? `Hola, ${user.name}. ` : ''}
          La administración de tu estudio todavía no ha aprobado tu acceso. Te avisaremos en cuanto puedas entrar a la agenda.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button to="/" kind="secondary">Volver al inicio</Button>
          <Button onClick={logout}>Cerrar sesión</Button>
        </div>
      </motion.div>
    </div>
  );
}
