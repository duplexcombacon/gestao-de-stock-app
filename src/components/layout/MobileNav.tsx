import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ScanBarcode, Warehouse, ArrowLeftRight,
  MoreHorizontal, RotateCcw, Users, UserCircle, LogOut, X,
} from 'lucide-react';
import { cn } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

const mainTabs = [
  { to: '/', icon: LayoutDashboard, label: 'Home', roles: ['admin', 'gestor', 'auditor'] },
  { to: '/produtos', icon: Package, label: 'Produtos', roles: ['admin', 'gestor', 'caixa', 'auditor'] },
  { to: '/scan', icon: ScanBarcode, label: 'Scan', roles: ['admin', 'gestor', 'caixa'] },
  { to: '/armazens', icon: Warehouse, label: 'Armazéns', roles: ['admin', 'gestor', 'caixa', 'auditor'] },
  { to: '/movimentos', icon: ArrowLeftRight, label: 'Movimentos', roles: ['admin', 'gestor', 'auditor'] },
];

const moreLinks = [
  { to: '/devolucoes', icon: RotateCcw, label: 'Devoluções', roles: ['admin', 'gestor'] },
  { to: '/admin/utilizadores', icon: Users, label: 'Utilizadores', roles: ['admin'] },
  { to: '/perfil', icon: UserCircle, label: 'Perfil', roles: ['admin', 'gestor', 'caixa', 'auditor'] },
];

export function MobileNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleMoreLink = (to: string) => {
    setDrawerOpen(false);
    navigate(to);
  };

  const handleSignOut = () => {
    setDrawerOpen(false);
    signOut();
  };

  const visibleMoreLinks = moreLinks.filter(link => !user || link.roles.includes(user.role));

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-raised border-t border-border">
        <div className="flex items-center justify-around px-2 py-1">
          {mainTabs
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
          {/* Botão "Mais" */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[10px] font-medium transition-colors min-w-0',
              drawerOpen ? 'text-accent' : 'text-text-muted',
            )}
          >
            <MoreHorizontal size={20} />
            <span>Mais</span>
          </button>
        </div>
        {/* Safe area for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* Drawer "Mais" */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Sheet */}
          <div className="relative bg-surface-raised rounded-t-2xl border-t border-border">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
              <span className="text-sm font-semibold text-text-primary">Mais opções</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Links adicionais */}
            <nav className="px-3 py-3 space-y-1">
              {visibleMoreLinks.map(({ to, icon: Icon, label }) => (
                <button
                  key={to}
                  onClick={() => handleMoreLink(to)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-colors"
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </nav>

            {/* Bloco de utilizador */}
            <div className="px-3 pt-3 pb-4 border-t border-border">
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-surface-overlay">
                <div className="size-9 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                  {getInitials(user?.name || user?.email || '')}
                </div>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleMoreLink('/perfil')}
                >
                  <p className="text-sm font-medium truncate text-text-primary">{user?.name || 'Utilizador'}</p>
                  <p className="text-xs text-text-muted truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-text-muted hover:text-danger transition-colors p-1"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
            {/* Safe area for iOS */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}
    </>
  );
}
