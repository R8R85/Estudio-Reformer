import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import { Button, Field, Input } from '../components/ui';

function YesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-1">
      {[['Sí', true], ['No', false]].map(([label, v]) => (
        <button
          key={label as string}
          type="button"
          onClick={() => onChange(v as boolean)}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${value === v ? 'bg-ink text-bg' : 'text-ink-muted'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [studioCode, setStudioCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [experienciaPrevia, setExperienciaPrevia] = useState(false);
  const [patologia, setPatologia] = useState(false);
  const [patologiaTexto, setPatologiaTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incompleto = !studioCode || !name || !email || !phone || password.length < 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        studioCode: studioCode.trim().toUpperCase(), name, email, phone, password,
        experienciaPrevia, patologia, patologiaTexto,
      });
      navigate('/pendiente');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen justify-center px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Link to="/" className="font-display text-sm font-bold tracking-tight text-ink-muted">
          ← NEXO<span className="font-medium">ESTUDIO</span>
        </Link>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">Solicitar acceso</h1>
        <p className="mt-2 text-sm text-ink-muted">
          El estudio revisa cada alta antes de abrir el acceso a la agenda. Te avisaremos en cuanto esté aprobada.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <Field label="Código de estudio" note="Te lo da el estudio al que te apuntas.">
            <Input value={studioCode} onChange={(e) => setStudioCode(e.target.value.toUpperCase())} placeholder="ENGUERA" required />
          </Field>
          <Field label="Nombre y apellidos">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alba Marí" required />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alba@correo.com" required />
          </Field>
          <Field label="Teléfono" note="Te enviaremos a este número el recordatorio de cada sesión por WhatsApp.">
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 000 000" required />
          </Field>
          <Field label="Contraseña">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Al menos 6 caracteres" required />
          </Field>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-ink-muted">¿Has hecho reformer antes?</span>
            <YesNo value={experienciaPrevia} onChange={setExperienciaPrevia} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-ink-muted">¿Tienes alguna patología que limite tu actividad física?</span>
            <YesNo value={patologia} onChange={setPatologia} />
          </div>
          {patologia && (
            <Field label="Cuéntame qué limitación tienes">
              <textarea
                value={patologiaTexto}
                onChange={(e) => setPatologiaTexto(e.target.value)}
                placeholder="Lesión, dolor o indicación médica a tener en cuenta"
                rows={3}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </Field>
          )}

          {error && <p className="text-sm text-risk">{error}</p>}

          <Button type="submit" loading={isSubmitting} disabled={incompleto} className="mt-1 w-full">
            Enviar solicitud
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          ¿Ya tienes cuenta? <Link to="/login" className="text-accent hover:underline">Entra aquí</Link>
        </p>
      </motion.div>
    </div>
  );
}
