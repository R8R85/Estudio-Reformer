import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';

export interface NavItem {
  to: string;
  label: string;
}

export function DashboardShell({ navItems, children }: { navItems: NavItem[]; children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-60 flex-col border-r border-line bg-surface px-5 py-6 md:flex">
        <Link to="/" className="font-display text-base font-bold tracking-tight">
          NEXO<span className="font-medium text-ink-muted">ESTUDIO</span>
        </Link>
        <nav className="mt-10 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                  active ? 'bg-accent-soft text-accent font-medium' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
          <p className="truncate px-1 text-sm font-medium">{user?.name}</p>
          <p className="truncate px-1 text-xs text-ink-faint">{user?.email}</p>
          <button onClick={logout} className="mt-2 rounded-lg px-3.5 py-2 text-left text-sm text-ink-muted hover:bg-surface-2 hover:text-risk">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-4 md:hidden">
          <span className="font-display text-base font-bold">NEXOESTUDIO</span>
          <button onClick={logout} className="text-sm text-ink-muted">Salir</button>
        </header>
        <main className="px-6 py-8 md:px-10 md:py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <nav className="flex justify-around border-t border-line bg-surface px-2 py-2 md:hidden">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={`rounded-lg px-3 py-2 text-xs ${location.pathname === item.to ? 'text-accent' : 'text-ink-muted'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
