
import { useState, useCallback } from 'react';
import type { SheetCutPiece, SheetProject, SheetOptimizationResult } from '@/types/sheet';
import { sheetOptimizationService } from '@/services/SheetOptimizationService';
import { sheetHistoryService } from '@/services/SheetHistoryService';
import { useToast } from '@/hooks/use-toast';
import type { OptimizationSettings } from './useOptimizationSettings';

export const useOptimizationExecution = () => {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState<SheetOptimizationResult | null>(null);

  const optimize = useCallback(async (
    pieces: SheetCutPiece[], 
    project: SheetProject, 
    optimizationSettings: OptimizationSettings,
    validationResult: { valid: boolean; errors: string[]; warnings: string[]; }
  ) => {
    if (pieces.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione peças antes de otimizar",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    setResults(null);

    try {
      if (!validationResult.valid) {
        toast({
          title: "Erro de Validação",
          description: `${validationResult.errors.length} erro(s) encontrado(s)`,
          variant: "destructive"
        });
        return;
      }

      if (validationResult.warnings.length > 0) {
        toast({
          title: "Avisos",
          description: `${validationResult.warnings.length} aviso(s) encontrado(s)`,
          variant: "default"
        });
      }

      console.log('Iniciando otimização de chapas com configurações:', optimizationSettings);
      const startTime = Date.now();
      
      const optimizationResult = await sheetOptimizationService.optimize(pieces, project);
      
      const endTime = Date.now();
      const optimizationTime = endTime - startTime;

      setResults(optimizationResult);

      try {
        await sheetHistoryService.saveOptimization(
          project,
          pieces,
          optimizationResult,
          optimizationSettings.algorithm,
          optimizationTime
        );
      } catch (historyError) {
        console.error('Erro ao salvar no histórico:', historyError);
      }

      toast({
        title: "Otimização Concluída",
        description: `${optimizationResult.totalSheets} chapa(s) - ${optimizationResult.averageEfficiency.toFixed(1)}% eficiência`,
      });

      console.log('Otimização concluída:', optimizationResult);
    } catch (error) {
      console.error('Erro na otimização:', error);
      toast({
        title: "Erro na Otimização",
        description: "Falha ao executar otimização. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [toast]);

  const compareAlgorithms = useCallback(async (pieces: SheetCutPiece[], project: SheetProject) => {
    if (pieces.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione peças antes de comparar algoritmos",
        variant: "destructive"
      });
      return null;
    }

    setIsOptimizing(true);
    
    try {
      toast({
        title: "Comparando Algoritmos",
        description: "Executando BLF vs Genetic... Aguarde.",
      });

      const comparison = await sheetOptimizationService.compareAlgorithms(pieces, project);
      
      toast({
        title: "Comparação Concluída",
        description: `Melhor: ${comparison.comparison.efficiency.winner} (${Math.max(comparison.comparison.efficiency.blf, comparison.comparison.efficiency.genetic).toFixed(1)}%)`,
      });

      return comparison;
    } catch (error) {
      console.error('Erro na comparação:', error);
      toast({
        title: "Erro na Comparação",
        description: "Falha ao comparar algoritmos. Tente novamente.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, [toast]);

  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  return {
    isOptimizing,
    results,
    optimize,
    compareAlgorithms,
    clearResults
  };
};
