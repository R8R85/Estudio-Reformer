import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as api from './api';
import type { PublicUser } from './api';

interface AuthState {
  user: PublicUser | null;
  isLoading: boolean;
  login: (studioCode: string, email: string, password: string) => Promise<PublicUser>;
  register: (body: Parameters<typeof api.register>[0]) => Promise<PublicUser>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!api.getToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.me();
        setUser(res.user);
      } catch {
        api.setToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(studioCode: string, email: string, password: string) {
    const res = await api.login(studioCode, email, password);
    api.setToken(res.token);
    setUser(res.user);
    return res.user;
  }

  async function register(body: Parameters<typeof api.register>[0]) {
    const res = await api.register(body);
    api.setToken(res.token);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    api.setToken(null);
    setUser(null);
  }

  async function refresh() {
    if (!api.getToken()) return;
    try {
      const res = await api.me();
      setUser(res.user);
    } catch {
      /* keep last known state */
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
