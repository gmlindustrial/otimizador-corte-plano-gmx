import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SobraItem {
  id: string;
  comprimento: number;
  quantidade: number;
  id_projeto_otimizacao?: string;
  id_perfis_materiais?: string;
  created_at: string;
  // Informações do perfil (via JOIN)
  descricao_perfil?: string;
  tipo_perfil?: string;
  kg_por_metro?: number;
}

export const useEstoqueSobras = () => {
  const [sobras, setSobras] = useState<SobraItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSobras = async (perfilId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('estoque_sobras')
        .select(`
          *,
          perfis_materiais (
            descricao_perfil,
            tipo_perfil,
            kg_por_metro
          )
        `)
        .order('created_at', { ascending: false });

      if (perfilId) {
        query = query.eq('id_perfis_materiais', perfilId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Mapear dados para incluir informações do perfil
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        descricao_perfil: item.perfis_materiais?.descricao_perfil,
        tipo_perfil: item.perfis_materiais?.tipo_perfil,
        kg_por_metro: item.perfis_materiais?.kg_por_metro
      }));
      
      setSobras(mappedData);
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
    otimId?: string,
    perfilId?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('estoque_sobras')
        .insert([{ 
          comprimento, 
          quantidade, 
          id_projeto_otimizacao: otimId,
          id_perfis_materiais: perfilId 
        }])
        .select(`
          *,
          perfis_materiais (
            descricao_perfil,
            tipo_perfil,
            kg_por_metro
          )
        `)
        .single();
      if (error) throw error;
      
      const mappedData = {
        ...data,
        descricao_perfil: (data as any).perfis_materiais?.descricao_perfil,
        tipo_perfil: (data as any).perfis_materiais?.tipo_perfil,
        kg_por_metro: (data as any).perfis_materiais?.kg_por_metro
      };
      
      setSobras(prev => [mappedData, ...prev]);
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

  return { sobras, loading, adicionarSobra, usarSobra, removerSobra, refetch: fetchSobras, fetchSobrasByPerfil: fetchSobras };
};
