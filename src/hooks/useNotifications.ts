import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const notifiedBatches = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const checkExpirations = async () => {
      try {
        const { data, error } = await supabase
          .from('expiring_batches')
          .select('*')
          .lte('days_until_expiry', 7); // <= 7 dias

        if (error) {
          console.error('Error fetching expiring batches for notifications:', error);
          return;
        }

        if (data && data.length > 0) {
          data.forEach(batch => {
            // Evitar spam: só notificar uma vez por sessão por lote
            if (notifiedBatches.current.has(batch.batch_id)) return;

            const days = batch.days_until_expiry;
            let message = '';
            
            if (days < 0) {
              message = `O lote ${batch.batch_code} de ${batch.product_name} já expirou há ${Math.abs(days)} dias!`;
            } else if (days === 0) {
              message = `Atenção! O lote ${batch.batch_code} de ${batch.product_name} expira HOJE.`;
            } else {
              message = `O lote ${batch.batch_code} de ${batch.product_name} vai expirar em ${days} dias.`;
            }

            toast(message, {
              description: `Quantidade restante: ${batch.quantity} em ${batch.warehouse_name || 'Armazém'}`,
              icon: '⚠️',
              duration: 8000,
            });

            notifiedBatches.current.add(batch.batch_id);
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkExpirations();

    // Opcional: configurar um temporizador para verificar periodicamente (ex: a cada hora)
    const interval = setInterval(checkExpirations, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [user]);
}
