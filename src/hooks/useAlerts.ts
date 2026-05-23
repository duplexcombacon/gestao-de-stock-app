import { mockAlerts } from '@/data/mock';

export function useAlerts() {
  const alerts = mockAlerts;
  const isLoading = false;
  return { alerts, isLoading, count: alerts.length };
}
