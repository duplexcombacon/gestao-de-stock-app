import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, Euro, ArrowLeftRight, AlertTriangle, TrendingDown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KpiCard } from '@/components/domain/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { mockKPIs, mockAlerts, mockMovements, mockProducts, getProductById } from '@/data/mock';
import { formatCurrency, formatRelativeDate, daysUntil } from '@/utils/formatters';

// Chart data: exits per day (last 7 days)
const chartData = (() => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: days[d.getDay()],
      saidas: Math.floor(Math.random() * 30) + 5,
    };
  });
})();

// Top 5 products by exits
const topProducts = (() => {
  const counts: Record<string, number> = {};
  mockMovements.filter(m => m.type === 'out').forEach(m => {
    counts[m.product_id] = (counts[m.product_id] || 0) + m.quantity;
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, qty]) => ({ product: getProductById(id)!, quantity: qty }));
})();

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Produtos"
          value={mockKPIs.total_products}
          icon={<Package size={18} />}
          variant="accent"
          trend={{ value: 12, label: 'vs mês anterior' }}
        />
        <KpiCard
          title="Capital em Stock"
          value={formatCurrency(mockKPIs.total_capital)}
          icon={<Euro size={18} />}
          variant="success"
          trend={{ value: 5.3, label: 'vs mês anterior' }}
        />
        <KpiCard
          title="Movimentos Hoje"
          value={mockKPIs.movements_today}
          icon={<ArrowLeftRight size={18} />}
          variant="default"
        />
        <KpiCard
          title="Alertas Ativos"
          value={mockKPIs.active_alerts}
          icon={<AlertTriangle size={18} />}
          variant={mockKPIs.active_alerts > 0 ? 'danger' : 'default'}
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
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-text-muted">{product.sku}</p>
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
          {mockAlerts.map(alert => (
            <div
              key={alert.id}
              onClick={() => navigate(`/produtos/${alert.product_id}`)}
              className="flex items-center gap-3 p-3 rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay transition-colors cursor-pointer"
            >
              {alert.type === 'low_stock' ? (
                <TrendingDown size={16} className="text-danger shrink-0" />
              ) : (
                <Clock size={16} className="text-warning shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.product_name}</p>
                <p className="text-xs text-text-muted">{alert.warehouse_name}</p>
              </div>
              <Badge variant={alert.type === 'low_stock' ? 'danger' : 'warning'} dot>
                {alert.type === 'low_stock'
                  ? `${alert.value}/${alert.threshold} un`
                  : `${daysUntil(new Date(Date.now() + alert.value * 86400000).toISOString())} dias`
                }
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
