import type { OptimizationResult } from '@/pages/Index';

interface PieceInput {
  length: number;
  quantity: number;
  tag?: string;
  conjunto?: string;
  perfil?: string;
  peso?: number;
}

interface BarPiece {
  length: number;
  color: string;
  label: string;
  tag?: string;
  conjunto?: string;
  perfil?: string;
  peso?: number;
}

interface BarResult {
  id: string;
  pieces: BarPiece[];
  waste: number;
  totalUsed: number;
  originalLength: number;
}

export interface LinearOptimizationResult extends OptimizationResult {
  bars: BarResult[];
}

export function runLinearOptimization(pieces: PieceInput[], barLength: number): LinearOptimizationResult {
  const expanded: PieceInput[] = [];
  pieces.forEach(p => {
    for (let i = 0; i < (p.quantity || 1); i++) {
      expanded.push({ ...p, quantity: 1 });
    }
  });

  expanded.sort((a, b) => b.length - a.length);

  const bars: BarResult[] = [];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
  const cutLoss = 3;

  expanded.forEach((piece, index) => {
    let placed = false;

    for (const bar of bars) {
      const available = barLength - bar.totalUsed;
      const needed = piece.length + (bar.pieces.length > 0 ? cutLoss : 0);
      if (available >= needed) {
        bar.pieces.push({
          length: piece.length,
          color: colors[index % colors.length],
          label: piece.tag ? String(piece.tag) : `${piece.length}mm`,
          tag: piece.tag,
          conjunto: piece.conjunto,
          perfil: piece.perfil,
          peso: piece.peso
        });
        bar.totalUsed += needed;
        bar.waste = barLength - bar.totalUsed;
        placed = true;
        break;
      }
    }

    if (!placed) {
      const bar: BarResult = {
        id: `bar-${bars.length + 1}`,
        pieces: [{
          length: piece.length,
          color: colors[index % colors.length],
          label: piece.tag ? String(piece.tag) : `${piece.length}mm`,
          tag: piece.tag,
          conjunto: piece.conjunto,
          perfil: piece.perfil,
          peso: piece.peso
        }],
        totalUsed: piece.length,
        waste: barLength - piece.length,
        originalLength: barLength
      };
      bars.push(bar);
    }
  });

  const totalWaste = bars.reduce((sum, b) => sum + b.waste, 0);
  const totalMaterial = bars.reduce((sum, b) => sum + b.originalLength, 0);
  const wastePercentage = totalMaterial > 0 ? (totalWaste / totalMaterial) * 100 : 0;

  return {
    bars,
    totalBars: bars.length,
    totalWaste,
    wastePercentage,
    efficiency: 100 - wastePercentage
  };
}
