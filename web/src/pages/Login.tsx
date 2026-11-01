import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import { Button, Field, Input } from '../components/ui';
import NexoMark3D from '../components/NexoMark3D';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [studioCode, setStudioCode] = useState(localStorage.getItem('nexo_last_studio_code') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(studioCode.trim().toUpperCase(), email, password);
      localStorage.setItem('nexo_last_studio_code', studioCode.trim().toUpperCase());
      if (user.status === 'PENDING') {
        navigate('/pendiente');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/member');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 items-center justify-center bg-ink lg:flex">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="h-80 w-80"
        >
          <NexoMark3D className="h-full w-full" />
        </motion.div>
      </div>
      <div className="flex w-full flex-col items-center justify-center px-6 py-16 lg:w-1/2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
          <Link to="/" className="font-display text-sm font-bold tracking-tight text-ink-muted">
            ← NEXO<span className="font-medium">ESTUDIO</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-2 text-sm text-ink-muted">Para socias y administración del estudio.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <Field label="Código de estudio" note="Te lo da tu estudio (p. ej. ENGUERA).">
              <Input value={studioCode} onChange={(e) => setStudioCode(e.target.value.toUpperCase())} placeholder="ENGUERA" required autoCapitalize="characters" />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alba@correo.com" required />
            </Field>
            <Field label="Contraseña">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>

            {error && <p className="text-sm text-risk">{error}</p>}

            <Button type="submit" loading={isSubmitting} disabled={!studioCode || !email || !password} className="mt-1 w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            ¿Eres nueva socia? <Link to="/registro" className="text-accent hover:underline">Solicita acceso</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
