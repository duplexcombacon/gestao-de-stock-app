import { useState, useRef, useEffect } from 'react';
import { Bell, Wifi, WifiOff, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { useNetworkState } from '@/hooks/useNetworkState';
import { Badge } from '@/components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export function Header({ title }: { title: string }) {
  const { isOnline } = useNetworkState();
  const { alerts, count: alertCount } = useAlerts();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-surface-overlay transition-colors cursor-pointer"
          >
            <Bell size={18} className="text-text-secondary" />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-danger text-[10px] text-white flex items-center justify-center font-bold">
                {alertCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface-raised border border-border rounded-xl shadow-lg z-50 overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-border flex items-center justify-between bg-surface-overlay/50">
                <h3 className="font-semibold text-sm">Notificações</h3>
                {alertCount > 0 && <Badge variant="danger" dot>{alertCount} ativas</Badge>}
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-text-muted">
                    Sem alertas no momento.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {alerts.map((alert: any) => (
                      <div
                        key={alert.entity_id || Math.random()}
                        onClick={() => {
                          setShowNotifications(false);
                          if (alert.entity_id) navigate(`/produtos/${alert.entity_id}`);
                        }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-overlay transition-colors cursor-pointer"
                      >
                        {alert.alert_type === 'low_stock' ? (
                          <TrendingDown size={16} className="text-danger shrink-0 mt-0.5" />
                        ) : (
                          <Clock size={16} className="text-warning shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight mb-1">{alert.title}</p>
                          <p className="text-xs text-text-muted">{alert.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
