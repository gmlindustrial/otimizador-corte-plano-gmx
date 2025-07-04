import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Project } from '@/types/project';
import type { OptimizationResult } from '@/types/optimization';
import type { CutPiece } from '@/types/cutPiece';

export interface OptimizationHistoryEntry {
  id: string;
  project: Project;
  pieces: CutPiece[];
  results: OptimizationResult;
  date: string;
  barLength: number;
}

export const useOptimizationHistoryPersistent = () => {
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('historico_otimizacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedHistory = data.map(convertFromDatabase).filter(Boolean) as OptimizationHistoryEntry[];
      setOptimizationHistory(convertedHistory);
      
      console.log('Histórico carregado do Supabase:', convertedHistory);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de otimizações');
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = async (
    project: Project,
    pieces: CutPiece[],
    results: OptimizationResult,
    barLength: number
  ) => {
    try {
      const historyData = {
        projeto_id: null, // Will be linked when project is saved
        bar_length: barLength,
        pecas: pieces as any, // Cast to Json type
        resultados: results as any // Cast to Json type
      };

      const { data, error } = await supabase
        .from('historico_otimizacoes')
        .insert(historyData)
        .select()
        .single();

      if (error) throw error;

      const newEntry: OptimizationHistoryEntry = {
        id: data.id,
        project,
        pieces: [...pieces],
        results,
        date: data.created_at,
        barLength
      };

      setOptimizationHistory(prev => [newEntry, ...prev]);

      // Auto-enviar sobras para estoque se habilitado
      if (project.enviarSobrasEstoque && results.totalWaste > 0) {
        await addWasteToStock(project, results);
      }

      console.log('Otimização salva no histórico:', newEntry);
      toast.success('Otimização salva no histórico');

    } catch (error) {
      console.error('Erro ao salvar no histórico:', error);
      toast.error('Erro ao salvar otimização no histórico');
    }
  };

  const addWasteToStock = async (project: Project, results: OptimizationResult) => {
    try {
      // Adicionar sobras ao estoque automaticamente
      const wasteEntries = results.bars
        .filter(bar => bar.waste > 50) // Só sobras > 50mm
        .map(bar => ({
          material_id: null, // Will be linked when material management is implemented
          comprimento: Math.floor(bar.waste),
          localizacao: `Auto-${project.projectNumber}`,
          projeto_origem: null, // Will be linked when project is saved
          quantidade: 1,
          disponivel: true
        }));

      if (wasteEntries.length > 0) {
        const { error } = await supabase
          .from('estoque_sobras')
          .insert(wasteEntries);

        if (error) throw error;

        console.log(`${wasteEntries.length} sobras adicionadas automaticamente ao estoque`);
        toast.success(`${wasteEntries.length} sobras adicionadas ao estoque automaticamente`);
      }
    } catch (error) {
      console.error('Erro ao adicionar sobras ao estoque:', error);
    }
  };

  const convertFromDatabase = (dbEntry: any): OptimizationHistoryEntry | null => {
    try {
      return {
        id: dbEntry.id,
        project: dbEntry.projeto_data || {
          id: 'temp-' + dbEntry.id,
          name: 'Projeto Carregado',
          projectNumber: 'TEMP-001',
          client: 'Cliente',
          obra: 'Obra',
          lista: 'LISTA 01',
          revisao: 'REV-00',
          tipoMaterial: 'Material',
          operador: 'Operador',
          turno: '1',
          aprovadorQA: 'QA',
          validacaoQA: true,
          enviarSobrasEstoque: false,
          qrCode: '',
          date: dbEntry.created_at
        },
        pieces: dbEntry.pecas || [],
        results: dbEntry.resultados || { bars: [], totalBars: 0, totalWaste: 0, wastePercentage: 0, efficiency: 0 },
        date: dbEntry.created_at,
        barLength: dbEntry.bar_length || 6000
      };
    } catch (error) {
      console.error('Erro ao converter entrada do histórico:', error);
      return null;
    }
  };

  const clearHistory = async () => {
    try {
      const { error } = await supabase
        .from('historico_otimizacoes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      setOptimizationHistory([]);
      toast.success('Histórico limpo com sucesso');
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      toast.error('Erro ao limpar histórico');
    }
  };

  const removeFromHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('historico_otimizacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOptimizationHistory(prev => prev.filter(entry => entry.id !== id));
      toast.success('Entrada removida do histórico');
    } catch (error) {
      console.error('Erro ao remover do histórico:', error);
      toast.error('Erro ao remover do histórico');
    }
  };

  const getHistoryStats = () => {
    if (optimizationHistory.length === 0) {
      return {
        totalOptimizations: 0,
        averageEfficiency: 0,
        totalMaterialSaved: 0,
        bestEfficiency: 0
      };
    }

    const totalOptimizations = optimizationHistory.length;
    const averageEfficiency = optimizationHistory.reduce((sum, entry) => sum + entry.results.efficiency, 0) / totalOptimizations;
    const totalMaterialSaved = optimizationHistory.reduce((sum, entry) => sum + entry.results.totalWaste, 0);
    const bestEfficiency = Math.max(...optimizationHistory.map(entry => entry.results.efficiency));

    return {
      totalOptimizations,
      averageEfficiency,
      totalMaterialSaved,
      bestEfficiency
    };
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return {
    optimizationHistory,
    loading,
    addToHistory,
    clearHistory,
    removeFromHistory,
    getHistoryStats,
    loadHistory
  };
};
