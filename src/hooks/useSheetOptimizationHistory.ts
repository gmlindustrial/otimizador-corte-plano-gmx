
import { useState, useCallback } from 'react';
import { sheetHistoryService, type SheetOptimizationHistory } from '@/services/SheetHistoryService';
import type { SheetCutPiece, SheetOptimizationResult, SheetProject } from '@/types/sheet';
import { useToast } from '@/hooks/use-toast';

export const useSheetOptimizationHistory = () => {
  const { toast } = useToast();
  const [history, setHistory] = useState<SheetOptimizationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Salvar otimização no histórico
  const saveOptimization = useCallback(async (
    project: SheetProject,
    pieces: SheetCutPiece[],
    results: SheetOptimizationResult,
    algorithm: string = 'MultiObjective',
    optimizationTime: number = 0
  ) => {
    try {
      setIsLoading(true);
      const historyId = await sheetHistoryService.saveOptimization(
        project,
        pieces,
        results,
        algorithm,
        optimizationTime
      );

      if (historyId) {
        toast({
          title: "Salvo no Histórico",
          description: "Otimização salva com sucesso no histórico",
        });

        // Recarregar histórico
        await loadHistory();
      }

      return historyId;
    } catch (error) {
      console.error('Erro ao salvar otimização:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar no histórico",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Carregar histórico
  const loadHistory = useCallback(async (limit: number = 50, offset: number = 0) => {
    try {
      setIsLoading(true);
      const { data, total } = await sheetHistoryService.getAllHistory(limit, offset);
      setHistory(data);
      return { data, total };
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro ao Carregar",
        description: "Não foi possível carregar o histórico",
        variant: "destructive",
      });
      return { data: [], total: 0 };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Buscar histórico por filtros
  const searchHistory = useCallback(async (filters: any) => {
    try {
      setIsLoading(true);
      const data = await sheetHistoryService.searchHistory(filters);
      setHistory(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Deletar do histórico
  const deleteFromHistory = useCallback(async (id: string) => {
    try {
      const success = await sheetHistoryService.deleteOptimization(id);
      
      if (success) {
        setHistory(prev => prev.filter(item => item.id !== id));
        toast({
          title: "Removido",
          description: "Otimização removida do histórico",
        });
      }

      return success;
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: "Erro ao Deletar",
        description: "Não foi possível remover do histórico",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Exportar histórico
  const exportHistory = useCallback(async () => {
    try {
      const csv = await sheetHistoryService.exportToCSV();
      
      if (csv) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historico-chapas-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Exportado",
          description: "Histórico exportado com sucesso",
        });
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro ao Exportar",
        description: "Não foi possível exportar o histórico",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    history,
    isLoading,
    saveOptimization,
    loadHistory,
    searchHistory,
    deleteFromHistory,
    exportHistory
  };
};
