import { useState } from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { mockAlerts } from '@/data/mock';
import { Badge } from '@/components/ui/Badge';

export function Header({ title }: { title: string }) {
  const [isOnline] = useState(true); // will come from sync hook later
  const alertCount = mockAlerts.length;

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-raised/50 backdrop-blur-sm sticky top-0 z-30">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Connection status */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          {isOnline ? <Wifi size={14} className="text-success" /> : <WifiOff size={14} className="text-danger" />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Alerts */}
        <button className="relative p-2 rounded-lg hover:bg-surface-overlay transition-colors cursor-pointer">
          <Bell size={18} className="text-text-secondary" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-danger text-[10px] text-white flex items-center justify-center font-bold">
              {alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
