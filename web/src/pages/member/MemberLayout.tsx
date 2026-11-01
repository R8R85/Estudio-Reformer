import { Outlet } from 'react-router-dom';
import { DashboardShell } from '../../components/Shell';

const NAV = [
  { to: '/member', label: 'Agenda' },
  { to: '/member/bono', label: 'Mi bono' },
  { to: '/member/reservas', label: 'Mis reservas' },
];

export default function MemberLayout() {
  return (
    <DashboardShell navItems={NAV}>
      <Outlet />
    </DashboardShell>
  );
}
