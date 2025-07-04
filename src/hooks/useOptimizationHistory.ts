
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

    // Log para relatórios
    console.log('Otimização adicionada ao histórico:', {
      id: historyEntry.id,
      efficiency: results.efficiency,
      totalBars: results.totalBars,
      waste: results.totalWaste
    });
  };

  const clearHistory = () => {
    setOptimizationHistory([]);
  };

  const removeFromHistory = (id: string) => {
    setOptimizationHistory(prev => prev.filter(entry => entry.id !== id));
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

  return {
    optimizationHistory,
    addToHistory,
    clearHistory,
    removeFromHistory,
    getHistoryStats
  };
};
