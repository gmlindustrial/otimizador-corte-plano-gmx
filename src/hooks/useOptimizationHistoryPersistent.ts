
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Project, OptimizationResult, CutPiece } from '@/pages/Index';
import { OptimizationHistoryService, type OptimizationHistoryEntry } from '@/services/OptimizationHistoryService';
import { ProjectService } from '@/services/ProjectService';
import { WasteStockService } from '@/services/WasteStockService';
import { useOptimizationStats } from './useOptimizationStats';

export const useOptimizationHistoryPersistent = () => {
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const convertedHistory = await OptimizationHistoryService.loadHistory();
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
      // Salvar ou obter projeto
      const savedProjectId = await ProjectService.saveOrGetProject(project, pieces, results, barLength);

      // Salvar entrada no histórico
      const newEntry = await OptimizationHistoryService.saveHistoryEntry(
        project,
        pieces,
        results,
        barLength,
        savedProjectId
      );

      setOptimizationHistory(prev => [newEntry, ...prev]);

      // Auto-enviar sobras para estoque se habilitado
      if (project.enviarSobrasEstoque && results.totalWaste > 0) {
        await WasteStockService.addWasteToStock(project, results, savedProjectId);
      }

      console.log('Otimização salva no histórico:', newEntry);
      toast.success('Otimização salva no histórico');

    } catch (error) {
      console.error('Erro ao salvar no histórico:', error);
      toast.error('Erro ao salvar otimização no histórico');
    }
  };

  const clearHistory = async () => {
    try {
      await OptimizationHistoryService.clearHistory();
      setOptimizationHistory([]);
      toast.success('Histórico limpo com sucesso');
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      toast.error('Erro ao limpar histórico');
    }
  };

  const removeFromHistory = async (id: string) => {
    try {
      await OptimizationHistoryService.removeEntry(id);
      setOptimizationHistory(prev => prev.filter(entry => entry.id !== id));
      toast.success('Entrada removida do histórico');
    } catch (error) {
      console.error('Erro ao remover do histórico:', error);
      toast.error('Erro ao remover do histórico');
    }
  };

  const getHistoryStats = useOptimizationStats(optimizationHistory);

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
