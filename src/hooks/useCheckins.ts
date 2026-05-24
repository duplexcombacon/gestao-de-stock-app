import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { OperatorCheckin } from '@/types';

// ── Filtros disponíveis para a listagem de check-ins ──
export interface CheckinFilters {
  user_id?: string;
  warehouse_id?: string;
  date_from?: string; // ISO date string (YYYY-MM-DD)
  date_to?: string;   // ISO date string (YYYY-MM-DD)
}

// ── Entrar/Sair de uma localização ──
// Chamado automaticamente quando o operador lê um QR de localização no Scanner
export async function toggleCheckin(
  userId: string,
  warehouseId: string,
): Promise<{ action: 'in' | 'out'; warehouseName: string } | null> {
  
  // 1. Obter o nome do armazém para feedback visual
  const { data: wh } = await supabase.from('warehouses').select('name').eq('id', warehouseId).single();
  const warehouseName = wh?.name || 'Localização';

  // 2. Verificar se o utilizador já tem uma sessão aberta neste armazém
  const { data: openSessions, error: findError } = await supabase
    .from('operator_checkins')
    .select('id')
    .eq('user_id', userId)
    .eq('warehouse_id', warehouseId)
    .is('checked_out_at', null)
    .limit(1);

  if (findError) {
    console.error('⚠️ Erro ao verificar sessão aberta:', findError.message);
    return null;
  }

  if (openSessions && openSessions.length > 0) {
    // Existe sessão aberta -> FECHAR SESSÃO (Saída)
    const { error: updateError } = await supabase
      .from('operator_checkins')
      .update({ checked_out_at: new Date().toISOString() })
      .eq('id', openSessions[0].id);
      
    if (updateError) {
      console.error('⚠️ Erro ao registar saída:', updateError.message);
      return null;
    }
    return { action: 'out', warehouseName };
  } else {
    // Não existe sessão aberta -> ABRIR SESSÃO (Entrada)
    const { error: insertError } = await supabase
      .from('operator_checkins')
      .insert({ user_id: userId, warehouse_id: warehouseId });
      
    if (insertError) {
      console.error('⚠️ Erro ao registar entrada:', insertError.message);
      return null;
    }
    return { action: 'in', warehouseName };
  }
}

// ── Hook para listar check-ins (para a página de Presenças) ──
export function useCheckins(filters?: CheckinFilters) {
  const [checkins, setCheckins] = useState<OperatorCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCheckins = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('operator_checkins')
        .select(
          `
          id,
          user_id,
          warehouse_id,
          checked_in_at,
          checked_out_at,
          user:profiles(id, name, email, role),
          warehouse:warehouses(id, name, type)
          `,
        )
        .order('checked_in_at', { ascending: false })
        .limit(500);

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.warehouse_id) {
        query = query.eq('warehouse_id', filters.warehouse_id);
      }
      if (filters?.date_from) {
        query = query.gte('checked_in_at', `${filters.date_from}T00:00:00Z`);
      }
      if (filters?.date_to) {
        query = query.lte('checked_in_at', `${filters.date_to}T23:59:59Z`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('🔴 Erro ao carregar check-ins:', error.message);
        return;
      }

      // Normalizar os dados de joins (Supabase pode retornar arrays em joins)
      const normalized = (data ?? []).map((row: any) => ({
        ...row,
        user: Array.isArray(row.user) ? row.user[0] : row.user,
        warehouse: Array.isArray(row.warehouse) ? row.warehouse[0] : row.warehouse,
      }));

      setCheckins(normalized as OperatorCheckin[]);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.user_id, filters?.warehouse_id, filters?.date_from, filters?.date_to]);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  return { checkins, isLoading, refresh: fetchCheckins };
}

// ── Estatísticas rápidas de check-ins ──
export function useCheckinStats() {
  const [todayEntries, setTodayEntries] = useState(0);
  const [insideNow, setInsideNow] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];

        // Entradas hoje
        const { count: entriesCount } = await supabase
          .from('operator_checkins')
          .select('id', { count: 'exact', head: true })
          .gte('checked_in_at', `${today}T00:00:00Z`);

        if (entriesCount !== null) {
          setTodayEntries(entriesCount);
        }

        // Quantos estão lá dentro agora (sessão aberta)
        const { count: insideCount } = await supabase
          .from('operator_checkins')
          .select('id', { count: 'exact', head: true })
          .is('checked_out_at', null);

        if (insideCount !== null) {
          setInsideNow(insideCount);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { todayEntries, insideNow, isLoading };
}

// ── Hook para operadores com sessão ativa em tempo real ──
export function useActiveOperators() {
  const [activeCheckins, setActiveCheckins] = useState<OperatorCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActive = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('operator_checkins')
        .select(`
          id, user_id, warehouse_id, checked_in_at, checked_out_at,
          user:profiles(id, name, email, role),
          warehouse:warehouses(id, name, type)
        `)
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false });

      if (!error && data) {
        const normalized = data.map((row: any) => ({
          ...row,
          user: Array.isArray(row.user) ? row.user[0] : row.user,
          warehouse: Array.isArray(row.warehouse) ? row.warehouse[0] : row.warehouse,
        }));
        setActiveCheckins(normalized as OperatorCheckin[]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  return { activeCheckins, isLoading, refresh: fetchActive };
}
