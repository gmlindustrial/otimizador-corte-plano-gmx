
import { useState } from 'react';

export interface OptimizationSettings {
  algorithm: 'BLF' | 'Genetic' | 'MultiObjective';
  maxGenerations: number;
  populationSize: number;
  mutationRate: number;
  enableNesting: boolean;
  priorityMode: 'efficiency' | 'speed' | 'balanced';
  timeLimit: number;
  enableEdgeRounding: boolean;
  roundingRadius: number;
  kerf: number;
}

export const useOptimizationSettings = () => {
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings>({
    algorithm: 'MultiObjective' as 'BLF' | 'Genetic' | 'MultiObjective',
    maxGenerations: 250,
    populationSize: 75,
    mutationRate: 0.15,
    enableNesting: true,
    priorityMode: 'balanced' as 'efficiency' | 'speed' | 'balanced',
    timeLimit: 120,
    enableEdgeRounding: false,
    roundingRadius: 2,
    kerf: 6 // Alterado de 2 para 6mm
  });

  return {
    optimizationSettings,
    setOptimizationSettings
  };
};
