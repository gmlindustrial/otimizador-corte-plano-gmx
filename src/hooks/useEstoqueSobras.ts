
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
    console.log('=== FETCH SOBRAS INICIADO ===');
    console.log('Material ID recebido:', materialId);
    console.log('Tipo do Material ID:', typeof materialId);
    
    // Only fetch if materialId is a valid UUID
    if (!materialId || !isValidUUID(materialId)) {
      console.log('Material ID inválido ou não fornecido:', materialId);
      setSobras([]);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Buscando sobras para material:', materialId);
      
      // First, let's check if the material exists
      const { data: materialCheck, error: materialError } = await supabase
        .from('materiais')
        .select('id, tipo')
        .eq('id', materialId)
        .single();
        
      if (materialError) {
        console.error('Erro ao verificar material:', materialError);
      } else {
        console.log('Material encontrado:', materialCheck);
      }
      
      const { data, error } = await supabase
        .from('estoque_sobras')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar sobras:', error);
        throw error;
      }

      console.log('Resposta da consulta de sobras:', data);
      console.log('Sobras encontradas:', data?.length || 0);
      setSobras(data || []);
    } catch (error) {
      console.error('Erro ao carregar sobras:', error);
      toast.error('Erro ao carregar estoque de sobras');
      setSobras([]);
    } finally {
      setLoading(false);
      console.log('=== FETCH SOBRAS FINALIZADO ===');
    }
  };

  const adicionarSobra = async (comprimento: number, localizacao: string, projetoOrigem?: string) => {
    console.log('=== ADICIONAR SOBRA ===');
    console.log('Dados:', { materialId, comprimento, localizacao, projetoOrigem });
    
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

      if (error) {
        console.error('Erro ao inserir sobra:', error);
        throw error;
      }
      
      console.log('Sobra inserida com sucesso:', data);
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
    console.log('useEffect disparado - materialId mudou:', materialId);
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
