import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SobraItem {
  id: string;
  material_id: string;
  comprimento: number;
  quantidade: number;
  localizacao: string;
  projeto_origem?: string;
  disponivel: boolean;
  created_at: string;
}

export const useEstoqueSobras = (materialId?: string) => {
  const [sobras, setSobras] = useState<SobraItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSobras = async () => {
    // Only fetch if materialId is a valid UUID
    if (!materialId || !isValidUUID(materialId)) {
      console.log('Material ID inválido ou não fornecido:', materialId);
      setSobras([]);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Buscando sobras para material:', materialId);
      
      const { data, error } = await supabase
        .from('estoque_sobras')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar sobras:', error);
        throw error;
      }

      console.log('Sobras encontradas:', data?.length || 0);
      setSobras(data || []);
    } catch (error) {
      console.error('Erro ao carregar sobras:', error);
      toast.error('Erro ao carregar estoque de sobras');
      setSobras([]);
    } finally {
      setLoading(false);
    }
  };

  const adicionarSobra = async (comprimento: number, localizacao: string, projetoOrigem?: string) => {
    if (!materialId || !isValidUUID(materialId)) {
      toast.error('Material não selecionado ou inválido');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('estoque_sobras')
        .insert([{
          material_id: materialId,
          comprimento,
          localizacao,
          projeto_origem: projetoOrigem,
          quantidade: 1,
          disponivel: true
        }])
        .select()
        .single();

      if (error) throw error;
      
      setSobras(prev => [data, ...prev]);
      toast.success(`Sobra adicionada: ${comprimento}mm - ${localizacao}`);
      return data;
    } catch (error) {
      console.error('Erro ao adicionar sobra:', error);
      toast.error('Erro ao adicionar sobra');
      throw error;
    }
  };

  const marcarComoUsada = async (id: string) => {
    try {
      const { error } = await supabase
        .from('estoque_sobras')
        .update({ disponivel: false })
        .eq('id', id);

      if (error) throw error;
      
      setSobras(prev => prev.map(s => 
        s.id === id ? { ...s, disponivel: false } : s
      ));
      toast.success('Sobra marcada como utilizada');
    } catch (error) {
      console.error('Erro ao marcar sobra como usada:', error);
      toast.error('Erro ao atualizar sobra');
    }
  };

  const removerSobra = async (id: string) => {
    try {
      const { error } = await supabase
        .from('estoque_sobras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSobras(prev => prev.filter(s => s.id !== id));
      toast.info('Sobra removida do estoque');
    } catch (error) {
      console.error('Erro ao remover sobra:', error);
      toast.error('Erro ao remover sobra');
    }
  };

  // Helper function to validate UUID
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  useEffect(() => {
    fetchSobras();
  }, [materialId]);

  return {
    sobras,
    loading,
    adicionarSobra,
    marcarComoUsada,
    removerSobra,
    refetch: fetchSobras
  };
};
