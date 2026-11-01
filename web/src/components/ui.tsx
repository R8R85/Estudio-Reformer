import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Badge({ tone = 'accent', children }: { tone?: 'accent' | 'good' | 'warn' | 'risk'; children: ReactNode }) {
  const tones: Record<string, string> = {
    accent: 'bg-accent-soft text-accent',
    good: 'bg-good-soft text-good',
    warn: 'bg-warn-soft text-warn',
    risk: 'bg-risk-soft text-risk',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Card({
  children, className = '', hover = false, onClick,
}: { children: ReactNode; className?: string; hover?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl2 border border-line bg-surface p-6 shadow-sm ${hover ? 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  to?: string;
  href?: string;
  type?: 'button' | 'submit';
  kind?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({ children, onClick, to, href, type = 'button', kind = 'primary', disabled, loading, className = '' }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const kinds: Record<string, string> = {
    primary: 'bg-ink text-bg hover:bg-accent hover:scale-[1.02] active:scale-[0.98]',
    secondary: 'bg-surface border border-line text-ink hover:border-accent hover:text-accent',
    ghost: 'text-ink-muted hover:text-ink',
  };
  const cls = `${base} ${kinds[kind]} ${className}`;
  const content = loading ? <Spinner /> : children;

  if (to) return <Link to={to} className={cls}>{content}</Link>;
  if (href) return <a href={href} className={cls}>{content}</a>;
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={cls}>
      {content}
    </button>
  );
}

export function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

export function Field({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
      {note && <span className="mt-1 block text-[11px] text-ink-faint">{note}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent ${props.className || ''}`}
    />
  );
}
