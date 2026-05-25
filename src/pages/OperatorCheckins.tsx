import { useState, useMemo } from 'react';
import { UserCheck, MapPin, Calendar, RefreshCw, Users, Clock } from 'lucide-react';
import { useCheckins, useCheckinStats, useActiveOperators } from '@/hooks/useCheckins';
import { useWarehouses } from '@/hooks/useWarehouses';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/formatters';

// ── Labels e cores por tipo de localização ──
const TYPE_LABEL: Record<string, string> = {
  warehouse: 'Armazém',
  corridor: 'Corredor',
  shelf: 'Prateleira',
  storage: 'Armazém',
  zone: 'Zona',
  store: 'Loja',
};

const TYPE_COLOR: Record<string, string> = {
  warehouse: 'bg-blue-500/10 text-blue-400 border-blue-400/20',
  storage: 'bg-blue-500/10 text-blue-400 border-blue-400/20',
  corridor: 'bg-purple-500/10 text-purple-400 border-purple-400/20',
  shelf: 'bg-green-500/10 text-green-400 border-green-400/20',
  zone: 'bg-orange-500/10 text-orange-400 border-orange-400/20',
  store: 'bg-pink-500/10 text-pink-400 border-pink-400/20',
};

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  gestor: 'Gestor',
  caixa: 'Operador',
  auditor: 'Auditor',
};

// ── Helper para formatar datas ──
function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    relative: getRelativeTime(d),
  };
}

function getRelativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return 'ontem';
  return `há ${Math.floor(diff / 86400)} dias`;
}

function getInitials(name: string) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getDuration(inIso: string, outIso: string | null | undefined) {
  if (!outIso) return 'Em curso...';
  const start = new Date(inIso).getTime();
  const end = new Date(outIso).getTime();
  const diff = Math.floor((end - start) / 60000); // minutes
  if (diff < 60) return `${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m}m`;
}

// ── Avatar colorido por utilizador ──
const AVATAR_COLORS = [
  'bg-accent/20 text-accent',
  'bg-purple-500/20 text-purple-400',
  'bg-green-500/20 text-green-400',
  'bg-orange-500/20 text-orange-400',
  'bg-pink-500/20 text-pink-400',
  'bg-cyan-500/20 text-cyan-400',
];

function getAvatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── KPI Card ──
function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={cn('size-12 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-sm text-text-secondary mt-0.5">{label}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Página Principal ──
export default function OperatorCheckins() {
  // Filtros
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filters = useMemo(() => ({
    user_id: selectedUser || undefined,
    warehouse_id: selectedWarehouse || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  }), [selectedUser, selectedWarehouse, dateFrom, dateTo]);

  const { checkins, isLoading, refresh } = useCheckins(filters);
  const { todayEntries, insideNow } = useCheckinStats();
  const { activeCheckins, isLoading: activeLoading, refresh: refreshActive } = useActiveOperators();
  const { warehousesFlat } = useWarehouses();

  // Lista de utilizadores únicos a partir dos check-ins carregados (sem filtros ativos)
  const { checkins: allCheckins } = useCheckins();
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    allCheckins.forEach(c => {
      if (c.user && !map.has(c.user_id)) {
        map.set(c.user_id, { id: c.user_id, name: c.user.name || c.user.email || c.user_id });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCheckins]);

  const hasFilters = selectedUser || selectedWarehouse || dateFrom || dateTo;

  function clearFilters() {
    setSelectedUser('');
    setSelectedWarehouse('');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={Clock}
          label="Entradas hoje"
          value={todayEntries}
          sub="total de acessos"
          color="bg-accent/10 text-accent"
        />
        <KpiCard
          icon={Users}
          label="Em armazém agora"
          value={insideNow}
          sub="operadores lá dentro"
          color="bg-purple-500/10 text-purple-400"
        />
        <KpiCard
          icon={UserCheck}
          label="Total no histórico"
          value={checkins.length}
          sub={hasFilters ? 'com filtros aplicados' : 'sem filtros'}
          color="bg-green-500/10 text-green-400"
        />
      </div>

      {/* ── Painel: Em Tempo Real ── */}
      <div className="bg-surface-raised border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-purple-400" />
            <h2 className="font-semibold text-text-primary">Em Armazém Agora</h2>
          </div>
          <button onClick={refreshActive} className="text-text-muted hover:text-accent">
            <RefreshCw size={14} />
          </button>
        </div>
        
        {activeLoading ? (
          <div className="flex items-center justify-center py-10">
             <div className="size-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeCheckins.length === 0 ? (
           <div className="py-10 text-center text-text-muted text-sm">
             Nenhum operador em funções num armazém de momento.
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {activeCheckins.map(checkin => {
                const { time } = formatDateTime(checkin.checked_in_at);
                const userName = checkin.user?.name || checkin.user?.email || 'Desconhecido';
                
                return (
                  <div key={checkin.id} className="border border-border rounded-lg p-4 flex items-center gap-3">
                    <div className={cn('size-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0', getAvatarColor(checkin.user_id))}>
                      {getInitials(userName)}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-medium text-text-primary truncate">{userName}</p>
                       <div className="flex items-center gap-1.5 mt-0.5">
                         <span className="relative flex size-2">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                           <span className="relative inline-flex rounded-full size-2 bg-success"></span>
                         </span>
                         <p className="text-xs text-text-muted truncate">
                           {checkin.warehouse?.name ?? '—'} (desde as {time})
                         </p>
                       </div>
                    </div>
                  </div>
                );
            })}
          </div>
        )}
      </div>

      {/* ── Filtros ── */}
      <div className="bg-surface-raised border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Calendar size={15} className="text-text-muted" />
            Filtros
          </p>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-surface-overlay"
              >
                Limpar filtros
              </button>
            )}
            <button
              onClick={refresh}
              className="size-7 rounded-lg bg-surface-overlay flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              title="Atualizar"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filtro por operador */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Operador</label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option value="">Todos os operadores</option>
              {uniqueUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro por localização */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Localização</label>
            <select
              value={selectedWarehouse}
              onChange={e => setSelectedWarehouse(e.target.value)}
              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option value="">Todas as localizações</option>
              {warehousesFlat.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro de data — início */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Data de</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Filtro de data — fim */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Data até</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ── Tabela / Lista de check-ins ── */}
      <div className="bg-surface-raised border border-border rounded-xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-accent" />
            <h2 className="font-semibold text-text-primary">Histórico de Presenças</h2>
          </div>
          <Badge variant="default">{checkins.length} registos</Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="size-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : checkins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="size-14 rounded-2xl bg-surface-overlay flex items-center justify-center mb-4">
              <UserCheck size={28} className="text-text-muted" />
            </div>
            <p className="font-medium text-text-secondary">Nenhuma presença registada</p>
            <p className="text-sm text-text-muted mt-1">
              {hasFilters
                ? 'Tente ajustar os filtros de pesquisa'
                : 'Os check-ins aparecem aqui quando os operadores leem QR Codes de localização'}
            </p>
          </div>
        ) : (
          <>
            {/* Cabeçalho da tabela (desktop) */}
            <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-2.5 bg-surface-overlay/50 border-b border-border">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Operador</p>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Localização</p>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Entrada</p>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Saída</p>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Duração</p>
            </div>

            {/* Linhas */}
            <div className="divide-y divide-border">
              {checkins.map(checkin => {
                const inTime = formatDateTime(checkin.checked_in_at);
                const outTime = checkin.checked_out_at ? formatDateTime(checkin.checked_out_at) : null;
                const duration = getDuration(checkin.checked_in_at, checkin.checked_out_at);
                
                const warehouseType = checkin.warehouse?.type ?? 'warehouse';
                const userName = checkin.user?.name || checkin.user?.email || 'Desconhecido';
                const userRole = checkin.user?.role ?? 'caixa';

                return (
                  <div
                    key={checkin.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-3 md:gap-4 px-5 py-3.5 hover:bg-surface-overlay/40 transition-colors"
                  >
                    {/* Operador */}
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                          getAvatarColor(checkin.user_id),
                        )}
                      >
                        {getInitials(userName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{userName}</p>
                        <p className="text-[11px] text-text-muted">{ROLE_LABEL[userRole] ?? userRole}</p>
                      </div>
                    </div>

                    {/* Localização */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="size-8 rounded-lg bg-surface-overlay flex items-center justify-center shrink-0">
                        <MapPin size={14} className="text-text-muted" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {checkin.warehouse?.name ?? '—'}
                        </p>
                        <span
                          className={cn(
                            'inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md border',
                            TYPE_COLOR[warehouseType] ?? TYPE_COLOR.warehouse,
                          )}
                        >
                          {TYPE_LABEL[warehouseType] ?? warehouseType}
                        </span>
                      </div>
                    </div>

                    {/* Entrada */}
                    <div className="flex flex-col md:block">
                      <p className="text-sm text-text-secondary">{inTime.date}</p>
                      <p className="text-[11px] text-text-muted">{inTime.time}</p>
                    </div>

                    {/* Saída */}
                    <div className="flex flex-col md:block">
                      <p className="text-sm text-text-secondary">{outTime ? outTime.date : '—'}</p>
                      <p className="text-[11px] text-text-muted">{outTime ? outTime.time : ''}</p>
                    </div>
                    
                    {/* Duração */}
                    <div className="flex items-center">
                       <Badge variant={checkin.checked_out_at ? "default" : "success"}>
                         {duration}
                       </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
