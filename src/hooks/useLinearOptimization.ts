import { useState } from 'react';
import type { Project, CutPiece, OptimizationResult } from '@/pages/Index';

export const useLinearOptimization = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [barLength, setBarLength] = useState(6000);
  const [pieces, setPieces] = useState<CutPiece[]>([]);
  const [results, setResults] = useState<OptimizationResult | null>(null);

  const handleOptimize = (onAddToHistory?: (project: Project, pieces: CutPiece[], results: OptimizationResult, barLength: number) => void) => {
    if (pieces.length === 0) return null;

    // Implementação do algoritmo First Fit Decreasing
    const sortedPieces: Array<{ length: number; originalIndex: number }> = [];
    pieces.forEach((piece, index) => {
      for (let i = 0; i < piece.quantity; i++) {
        sortedPieces.push({ length: piece.length, originalIndex: index });
      }
    });
    
    // Ordenar por tamanho decrescente
    sortedPieces.sort((a, b) => b.length - a.length);

    const bars: Array<{
      id: string;
      pieces: Array<{ length: number; color: string; label: string }>;
      waste: number;
      totalUsed: number;
    }> = [];

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

    sortedPieces.forEach((piece) => {
      const cutLoss = 3; // 3mm perda por corte
      let placed = false;

      // Tentar colocar na barra existente
      for (const bar of bars) {
        const availableSpace = barLength - bar.totalUsed;
        const spaceNeeded = piece.length + (bar.pieces.length > 0 ? cutLoss : 0);
        
        if (availableSpace >= spaceNeeded) {
          bar.pieces.push({
            length: piece.length,
            color: colors[piece.originalIndex % colors.length],
            label: `${piece.length}mm`
          });
          bar.totalUsed += spaceNeeded;
          bar.waste = barLength - bar.totalUsed;
          placed = true;
          break;
        }
      }

      // Se não coube, criar nova barra
      if (!placed) {
        const newBar = {
          id: `bar-${bars.length + 1}`,
          pieces: [{
            length: piece.length,
            color: colors[piece.originalIndex % colors.length],
            label: `${piece.length}mm`
          }],
          waste: 0,
          totalUsed: piece.length
        };
        newBar.waste = barLength - newBar.totalUsed;
        bars.push(newBar);
      }
    });

    const totalWaste = bars.reduce((sum, bar) => sum + bar.waste, 0);
    const totalMaterial = bars.length * barLength;
    const wastePercentage = (totalWaste / totalMaterial) * 100;

    const optimizationResult: OptimizationResult = {
      bars,
      totalBars: bars.length,
      totalWaste,
      wastePercentage,
      efficiency: 100 - wastePercentage
    };

    setResults(optimizationResult);

    // Call callback if provided (for backward compatibility)
    if (project && onAddToHistory) {
      onAddToHistory(project, pieces, optimizationResult, barLength);
    }

    return optimizationResult;
  };

  return {
    project,
    setProject,
    barLength,
    setBarLength,
    pieces,
    setPieces,
    results,
    setResults,
    handleOptimize
  };
};
