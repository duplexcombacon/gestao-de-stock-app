import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, Euro, ArrowLeftRight, AlertTriangle, TrendingDown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KpiCard } from '@/components/domain/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatRelativeDate, daysUntil } from '@/utils/formatters';
import { useDashboard } from '@/hooks/useDashboard';
import { useMovements } from '@/hooks/useMovements';

export default function Dashboard() {
  const navigate = useNavigate();
  const { kpis, alerts, loading } = useDashboard();
  const { movements } = useMovements();

  const chartData = (() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      
      // Calculate exits for this specific day
      const startOfDay = new Date(d.setHours(0, 0, 0, 0)).getTime();
      const endOfDay = new Date(d.setHours(23, 59, 59, 999)).getTime();
      
      const exits = movements.filter((m: any) => {
        const time = new Date(m.created_at).getTime();
        return m.type === 'out' && time >= startOfDay && time <= endOfDay;
      }).reduce((sum: number, m: any) => sum + m.quantity, 0);

      return {
        day: days[d.getDay()],
        saidas: exits,
      };
    });
  })();

  const topProducts = (() => {
    const counts: Record<string, { product: any, quantity: number }> = {};
    movements.filter((m: any) => m.type === 'out').forEach((m: any) => {
      if (!counts[m.product_id]) {
        counts[m.product_id] = { product: m.product, quantity: 0 };
      }
      counts[m.product_id].quantity += m.quantity;
    });
    return Object.values(counts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  })();

  if (loading || !kpis) {
    return <div className="flex justify-center py-20 text-text-muted">A carregar dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Produtos"
          value={kpis.total_products}
          icon={<Package size={18} />}
          variant="accent"
        />
        <KpiCard
          title="Capital em Stock"
          value={formatCurrency(kpis.total_capital)}
          icon={<Euro size={18} />}
          variant="success"
        />
        <KpiCard
          title="Movimentos Hoje"
          value={kpis.movements_today}
          icon={<ArrowLeftRight size={18} />}
          variant="default"
        />
        <KpiCard
          title="Alertas Ativos"
          value={kpis.active_alerts}
          icon={<AlertTriangle size={18} />}
          variant={kpis.active_alerts > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-surface-raised border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary mb-4">Saídas — Últimos 7 dias</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fill: '#8b90a0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5c6178', fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: '#1a1d27', border: '1px solid #2e3345', borderRadius: '8px', fontSize: '13px' }}
                itemStyle={{ color: '#e8eaf0' }}
                labelStyle={{ color: '#8b90a0' }}
              />
              <Bar dataKey="saidas" fill="#4f8cff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="bg-surface-raised border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary mb-4">Top 5 — Mais saídas</h2>
          <div className="space-y-3">
            {topProducts.map(({ product, quantity }, i) => (
              <div
                key={product.id}
                onClick={() => navigate(`/produtos/${product.id}`)}
                className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-surface-overlay cursor-pointer transition-colors"
              >
                <span className="text-xs text-text-muted w-4 text-right">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product?.name || '—'}</p>
                  <p className="text-xs text-text-muted">{product?.sku || '—'}</p>
                </div>
                <span className="text-sm font-mono font-semibold text-text-secondary">{quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-surface-raised border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Alertas Ativos</h2>
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <p className="text-sm text-text-muted py-2">Sem alertas de momento.</p>
          ) : (
            alerts.map((alert: any) => (
              <div
                key={alert.entity_id || Math.random()}
                onClick={() => alert.entity_id ? navigate(`/produtos/${alert.entity_id}`) : null}
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay transition-colors cursor-pointer"
              >
                {alert.alert_type === 'low_stock' ? (
                  <TrendingDown size={16} className="text-danger shrink-0" />
                ) : (
                  <Clock size={16} className="text-warning shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-text-muted">{alert.description}</p>
                </div>
                <Badge variant={alert.alert_type === 'low_stock' ? 'danger' : 'warning'} dot>
                  {alert.alert_type === 'low_stock' ? 'Baixo' : 'Expira'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
