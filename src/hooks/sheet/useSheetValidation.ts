
import { useState, useCallback } from 'react';
import type { SheetCutPiece, SheetProject } from '@/types/sheet';
import { sheetOptimizationService } from '@/services/SheetOptimizationService';
import { useToast } from '@/hooks/use-toast';

export const useSheetValidation = () => {
  const { toast } = useToast();
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [projectStats, setProjectStats] = useState<any | null>(null);

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

  const clearValidation = useCallback(() => {
    setValidation(null);
    setProjectStats(null);
  }, []);

  return {
    validation,
    projectStats,
    validatePieces,
    calculateStats,
    clearValidation
  };
};
