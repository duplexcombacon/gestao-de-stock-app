import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Alert } from '@/types';

export function useAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts_view')
        .select('*')
        .order('severity', { ascending: false });

      if (error) {
        console.error('Erro ao carregar alertas:', error.message);
        return [];
      }
      return data as unknown as Alert[];
    },
    // Fazemos poll ocasional no caso de estarmos numa view materializada sem triggers perfeitos
    refetchInterval: 1000 * 60 * 5, // 5 minutos
  });

  // Supabase Realtime para invocar a re-verificação de alertas sempre que o inventário muda
  useEffect(() => {
    const channel = supabase.channel('inventory_alerts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        () => {
          // Sempre que um stock muda, invalidamos a query dos alertas para buscar valores frescos
          console.log('[Realtime] Inventário alterado. A atualizar alertas...');
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { 
    alerts, 
    isLoading, 
    count: alerts.length 
  };
}
