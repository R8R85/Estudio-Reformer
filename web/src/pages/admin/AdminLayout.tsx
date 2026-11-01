import { Outlet } from 'react-router-dom';
import { DashboardShell } from '../../components/Shell';

const NAV = [
  { to: '/admin', label: 'Agenda' },
  { to: '/admin/franjas', label: 'Franjas' },
  { to: '/admin/solicitudes', label: 'Solicitudes' },
  { to: '/admin/socias', label: 'Socias' },
  { to: '/admin/bonos', label: 'Bonos' },
  { to: '/admin/ajustes', label: 'Ajustes' },
  { to: '/admin/facturacion', label: 'Facturación' },
];

export default function AdminLayout() {
  return (
    <DashboardShell navItems={NAV}>
      <Outlet />
    </DashboardShell>
  );
}
