
import { useState } from 'react';
import type { Project, OptimizationResult, CutPiece } from '@/pages/Index';

export interface OptimizationHistoryEntry {
  id: string;
  project: Project;
  pieces: CutPiece[];
  results: OptimizationResult;
  date: string;
  barLength: number;
}

export const useOptimizationHistory = () => {
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistoryEntry[]>([]);

  const addToHistory = (
    project: Project,
    pieces: CutPiece[],
    results: OptimizationResult,
    barLength: number
  ) => {
    const historyEntry: OptimizationHistoryEntry = {
      id: Date.now().toString(),
      project,
      pieces: [...pieces],
      results,
      date: new Date().toISOString(),
      barLength
    };
    setOptimizationHistory(prev => [historyEntry, ...prev]);

    // Auto-enviar sobras para estoque se habilitado
    if (project.enviarSobrasEstoque && results.totalWaste > 0) {
      console.log('Enviando sobras automaticamente para o estoque:', {
        totalWaste: results.totalWaste,
        material: project.tipoMaterial,
        projeto: project.projectNumber
      });
    }
  };

  return {
    optimizationHistory,
    addToHistory
  };
};
