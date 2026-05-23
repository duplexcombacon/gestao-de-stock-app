import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ScanBarcode, Warehouse,
  ArrowLeftRight, RotateCcw, Users, LogOut,
} from 'lucide-react';
import { cn } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'gestor', 'auditor'] },
  { to: '/produtos', icon: Package, label: 'Produtos', roles: ['admin', 'gestor', 'caixa', 'auditor'] },
  { to: '/scan', icon: ScanBarcode, label: 'Scanner', roles: ['admin', 'gestor', 'caixa'] },
  { to: '/armazens', icon: Warehouse, label: 'Armazéns', roles: ['admin', 'gestor', 'caixa', 'auditor'] },
  { to: '/movimentos', icon: ArrowLeftRight, label: 'Movimentos', roles: ['admin', 'gestor', 'auditor'] },
  { to: '/devolucoes', icon: RotateCcw, label: 'Devoluções', roles: ['admin', 'gestor'] },
  { to: '/admin/utilizadores', icon: Users, label: 'Utilizadores', roles: ['admin'] },
];

export function Sidebar() {
  const { user, signOut } = useAuth();

  // Helper to get initials (e.g. "João Caixa" -> "JC", or "admin@admin.com" -> "AA")
  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen bg-surface-raised border-r border-border fixed left-0 top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-accent flex items-center justify-center">
            <Package size={18} className="text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">StockFlow</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links
          .filter(link => !user || link.roles.includes(user.role))
          .map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay',
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="size-8 rounded-full bg-surface-overlay flex items-center justify-center text-xs font-bold text-text-secondary">
            {getInitials(user?.name || user?.email || '')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'Utilizador'}</p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
          <button 
            onClick={signOut}
            className="text-text-muted hover:text-danger transition-colors cursor-pointer"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}