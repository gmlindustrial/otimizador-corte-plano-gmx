
import { useCallback } from 'react';
import type { SheetCutPiece, SheetProject } from '@/types/sheet';
import { sheetOptimizationService } from '@/services/SheetOptimizationService';
import { useOptimizationSettings } from './sheet/useOptimizationSettings';
import { useSheetValidation } from './sheet/useSheetValidation';
import { useOptimizationExecution } from './sheet/useOptimizationExecution';

interface UseSheetOptimizationReturn {
  isOptimizing: boolean;
  results: any | null;
  validation: any | null;
  projectStats: any | null;
  optimizationSettings: any;
  setOptimizationSettings: (settings: any) => void;
  optimize: (pieces: SheetCutPiece[], project: SheetProject) => Promise<void>;
  validatePieces: (pieces: SheetCutPiece[], project: SheetProject) => void;
  calculateStats: (pieces: SheetCutPiece[], project: SheetProject) => void;
  compareAlgorithms: (pieces: SheetCutPiece[], project: SheetProject) => Promise<any>;
  clearResults: () => void;
}

export const useSheetOptimization = (): UseSheetOptimizationReturn => {
  const { optimizationSettings, setOptimizationSettings } = useOptimizationSettings();
  const { validation, projectStats, validatePieces, calculateStats, clearValidation } = useSheetValidation();
  const { isOptimizing, results, optimize: executeOptimization, compareAlgorithms, clearResults: clearOptimizationResults } = useOptimizationExecution();

  const optimize = useCallback(async (pieces: SheetCutPiece[], project: SheetProject) => {
    // Validate pieces first
    const validationResult = sheetOptimizationService.validatePieces(pieces, project);
    
    // Execute optimization with validation result
    await executeOptimization(pieces, project, optimizationSettings, validationResult);
  }, [executeOptimization, optimizationSettings]);

  const clearResults = useCallback(() => {
    clearOptimizationResults();
    clearValidation();
  }, [clearOptimizationResults, clearValidation]);

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
