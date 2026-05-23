import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ScanBarcode, Warehouse, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

const tabs = [
  { to: '/', icon: LayoutDashboard, label: 'Home', roles: ['admin', 'gestor', 'auditor'] },
  { to: '/produtos', icon: Package, label: 'Produtos', roles: ['admin', 'gestor', 'caixa', 'auditor'] },
  { to: '/scan', icon: ScanBarcode, label: 'Scan', roles: ['admin', 'gestor', 'caixa'] },
  { to: '/armazens', icon: Warehouse, label: 'Armazéns', roles: ['admin', 'gestor', 'caixa', 'auditor'] },
  { to: '/movimentos', icon: ArrowLeftRight, label: 'Movimentos', roles: ['admin', 'gestor', 'auditor'] },
];

export function MobileNav() {
  const { user } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-raised border-t border-border">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs
          .filter(tab => !user || tab.roles.includes(user.role))
          .map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[10px] font-medium transition-colors min-w-0',
                  isActive ? 'text-accent' : 'text-text-muted',
                )
              }
            >
              <Icon size={20} />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
