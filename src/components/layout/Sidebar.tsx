import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ScanBarcode, Warehouse,
  ArrowLeftRight, RotateCcw, LogOut,
} from 'lucide-react';
import { cn } from '@/utils/formatters';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/scan', icon: ScanBarcode, label: 'Scanner' },
  { to: '/armazens', icon: Warehouse, label: 'Armazéns' },
  { to: '/movimentos', icon: ArrowLeftRight, label: 'Movimentos' },
  { to: '/devolucoes', icon: RotateCcw, label: 'Devoluções' },
];

export function Sidebar() {
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
        {links.map(({ to, icon: Icon, label }) => (
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
            JC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">João Caixa</p>
            <p className="text-xs text-text-muted truncate">caixa@stock.pt</p>
          </div>
          <button className="text-text-muted hover:text-danger transition-colors cursor-pointer">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
