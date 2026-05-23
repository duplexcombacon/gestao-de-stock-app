import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface DashboardKPIs {
  total_products: number;
  total_capital: number;
  movements_today: number;
  active_alerts: number;
}

export interface Alert {
  alert_type: 'low_stock' | 'expiring_batch';
  entity_id: string;
  title: string;
  description: string;
  expiry_date: string | null;
  severity: number;
}

export function useDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch KPIs via RPC
      const { data: kpiData, error: kpiError } = await supabase
        .rpc('get_dashboard_kpis');

      if (kpiError) throw kpiError;
      setKpis(kpiData as DashboardKPIs);

      // Fetch active alerts via View
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts_view')
        .select('*')
        .order('severity', { ascending: false });

      if (alertsError) throw alertsError;
      setAlerts(alertsData as Alert[]);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // To keep the dashboard relatively fresh, we could subscribe to inventory changes,
    // but views don't support direct Realtime subscriptions easily in Postgres.
    // Instead, we subscribe to the underlying tables that drive the KPIs:
    const subscription = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movements' }, fetchDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchDashboardData]);

  return { kpis, alerts, loading, error, refetch: fetchDashboardData };
}
