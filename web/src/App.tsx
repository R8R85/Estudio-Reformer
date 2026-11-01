import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './lib/auth';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Pending from './pages/Pending';

import MemberLayout from './pages/member/MemberLayout';
import MemberAgenda from './pages/member/Agenda';
import MemberBono from './pages/member/Bono';
import MemberReservas from './pages/member/Reservas';

import AdminLayout from './pages/admin/AdminLayout';
import AdminAgenda from './pages/admin/Agenda';
import AdminFranjas from './pages/admin/Franjas';
import AdminSolicitudes from './pages/admin/Solicitudes';
import AdminSocios from './pages/admin/Socios';
import AdminBonos from './pages/admin/Bonos';
import AdminAjustes from './pages/admin/Ajustes';
import AdminFacturacion from './pages/admin/Facturacion';

/** Gatekeeper for any route under a given role — bounces to /login while the
 *  session is still loading or missing, to /pendiente for a not-yet-approved
 *  member, and away from the wrong role's area entirely. */
function Protected({ role, children }: { role: 'MEMBER' | 'ADMIN'; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-sm text-ink-muted">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.status === 'PENDING') return <Navigate to="/pendiente" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/member'} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/pendiente" element={<Pending />} />

      <Route path="/member" element={<Protected role="MEMBER"><MemberLayout /></Protected>}>
        <Route index element={<MemberAgenda />} />
        <Route path="bono" element={<MemberBono />} />
        <Route path="reservas" element={<MemberReservas />} />
      </Route>

      <Route path="/admin" element={<Protected role="ADMIN"><AdminLayout /></Protected>}>
        <Route index element={<AdminAgenda />} />
        <Route path="franjas" element={<AdminFranjas />} />
        <Route path="solicitudes" element={<AdminSolicitudes />} />
        <Route path="socias" element={<AdminSocios />} />
        <Route path="bonos" element={<AdminBonos />} />
        <Route path="ajustes" element={<AdminAjustes />} />
        <Route path="facturacion" element={<AdminFacturacion />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
