import { useState, useCallback } from 'react';
import type { SheetCutPiece, SheetProject, SheetOptimizationResult } from '@/types/sheet';
import { sheetOptimizationService } from '@/services/SheetOptimizationService';
import { sheetHistoryService } from '@/services/SheetHistoryService';
import { useToast } from '@/hooks/use-toast';

interface UseSheetOptimizationReturn {
  isOptimizing: boolean;
  results: SheetOptimizationResult | null;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
  projectStats: any | null;
  optimizationSettings: {
    algorithm: 'BLF' | 'Genetic' | 'MultiObjective';
    maxGenerations: number;
    populationSize: number;
    mutationRate: number;
    enableNesting: boolean;
    priorityMode: 'efficiency' | 'speed' | 'balanced';
    timeLimit: number;
  };
  setOptimizationSettings: (settings: any) => void;
  optimize: (pieces: SheetCutPiece[], project: SheetProject) => Promise<void>;
  validatePieces: (pieces: SheetCutPiece[], project: SheetProject) => void;
  calculateStats: (pieces: SheetCutPiece[], project: SheetProject) => void;
  compareAlgorithms: (pieces: SheetCutPiece[], project: SheetProject) => Promise<any>;
  clearResults: () => void;
}

export const useSheetOptimization = (): UseSheetOptimizationReturn => {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState<SheetOptimizationResult | null>(null);
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [projectStats, setProjectStats] = useState<any | null>(null);
  const [optimizationSettings, setOptimizationSettings] = useState({
    algorithm: 'MultiObjective' as 'BLF' | 'Genetic' | 'MultiObjective',
    maxGenerations: 250,
    populationSize: 75,
    mutationRate: 0.15,
    enableNesting: true,
    priorityMode: 'balanced' as 'efficiency' | 'speed' | 'balanced',
    timeLimit: 120
  });

  const optimize = useCallback(async (pieces: SheetCutPiece[], project: SheetProject) => {
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
      // Validar peças antes da otimização
      const validationResult = sheetOptimizationService.validatePieces(pieces, project);
      setValidation(validationResult);

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

      // Executar otimização com configurações avançadas
      console.log('Iniciando otimização de chapas com configurações:', optimizationSettings);
      const startTime = Date.now();
      
      const optimizationResult = await sheetOptimizationService.optimize(pieces, project, optimizationSettings);
      
      const endTime = Date.now();
      const optimizationTime = endTime - startTime;

      setResults(optimizationResult);

      // Salvar no histórico com todos os parâmetros necessários
      await sheetHistoryService.saveOptimization(
        project,
        pieces,
        optimizationResult,
        optimizationSettings.algorithm,
        optimizationTime
      );

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
  }, [toast, optimizationSettings]);

  const validatePieces = useCallback((pieces: SheetCutPiece[], project: SheetProject) => {
    const validationResult = sheetOptimizationService.validatePieces(pieces, project);
    setValidation(validationResult);

    if (validationResult.errors.length > 0) {
      toast({
        title: "Erros de Validação",
        description: `${validationResult.errors.length} erro(s) encontrado(s)`,
        variant: "destructive"
      });
    }

    if (validationResult.warnings.length > 0) {
      toast({
        title: "Avisos",
        description: `${validationResult.warnings.length} aviso(s) encontrado(s)`,
      });
    }
  }, [toast]);

  const calculateStats = useCallback((pieces: SheetCutPiece[], project: SheetProject) => {
    const stats = sheetOptimizationService.calculateProjectStats(pieces, project);
    setProjectStats(stats);
  }, []);

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
    setValidation(null);
    setProjectStats(null);
  }, []);

  return {
    isOptimizing,
    results,
    validation,
    projectStats,
    optimizationSettings,
    setOptimizationSettings,
    optimize,
    validatePieces,
    calculateStats,
    compareAlgorithms,
    clearResults
  };
};
