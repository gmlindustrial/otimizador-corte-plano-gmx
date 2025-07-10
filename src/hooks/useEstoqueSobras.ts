import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SobraItem {
  id: string;
  comprimento: number;
  quantidade: number;
  id_projeto_otimizacao?: string;
  created_at: string;
}

export const useEstoqueSobras = () => {
  const [sobras, setSobras] = useState<SobraItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSobras = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('estoque_sobras')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSobras(data || []);
    } catch (error) {
      console.error('Erro ao carregar sobras:', error);
      toast.error('Erro ao carregar estoque de sobras');
      setSobras([]);
    } finally {
      setLoading(false);
    }
  };

  const adicionarSobra = async (
    comprimento: number,
    quantidade: number,
    otimId?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('estoque_sobras')
        .insert([{ comprimento, quantidade, id_projeto_otimizacao: otimId }])
        .select()
        .single();
      if (error) throw error;
      setSobras(prev => [data, ...prev]);
      toast.success('Sobra adicionada');
    } catch (error) {
      console.error('Erro ao adicionar sobra:', error);
      toast.error('Erro ao adicionar sobra');
    }
  };

  const usarSobra = async (id: string, qty = 1) => {
    try {
      const { data, error } = await supabase
        .from('estoque_sobras')
        .select('quantidade')
        .eq('id', id)
        .single();
      if (error) throw error;
      const novaQtd = (data?.quantidade || 0) - qty;
      if (novaQtd <= 0) {
        const { error: delErr } = await supabase
          .from('estoque_sobras')
          .delete()
          .eq('id', id);
        if (delErr) throw delErr;
        setSobras(prev => prev.filter(s => s.id !== id));
      } else {
        const { error: updErr, data: updated } = await supabase
          .from('estoque_sobras')
          .update({ quantidade: novaQtd })
          .eq('id', id)
          .select()
          .single();
        if (updErr) throw updErr;
        setSobras(prev => prev.map(s => (s.id === id ? updated : s)));
      }
    } catch (error) {
      console.error('Erro ao usar sobra:', error);
      toast.error('Erro ao atualizar sobra');
    }
  };

  const removerSobra = async (id: string) => {
    try {
      const { error } = await supabase.from('estoque_sobras').delete().eq('id', id);
      if (error) throw error;
      setSobras(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Erro ao remover sobra:', error);
      toast.error('Erro ao remover sobra');
    }
  };

  useEffect(() => {
    void fetchSobras();
  }, []);

  return { sobras, loading, adicionarSobra, usarSobra, removerSobra, refetch: fetchSobras };
};
