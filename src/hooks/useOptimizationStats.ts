
import type { OptimizationHistoryEntry } from '@/services/OptimizationHistoryService';

export interface OptimizationStats {
  totalOptimizations: number;
  averageEfficiency: number;
  totalMaterialSaved: number;
  bestEfficiency: number;
}

export const useOptimizationStats = (optimizationHistory: OptimizationHistoryEntry[]): OptimizationStats => {
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
