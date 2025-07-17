import type { OptimizationResult } from "@/pages/Index";
import { PerfilMaterial } from "@/types/project";

interface PieceInput {
  length: number;
  quantity: number;
  tag?: string;
  conjunto?: string;
  perfil?: string;
  peso?: number;
  posicao?: string;
}

interface BarPiece {
  length: number;
  color: string;
  label: string;
  tag?: string;
  conjunto?: string;
  perfil?: string;
  peso?: number;
  posicao?: string;
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

export function runLinearOptimization(
  pieces: PieceInput[],
  barLength: number
): LinearOptimizationResult {
  const expanded: PieceInput[] = [];
  pieces.forEach((p) => {
    for (let i = 0; i < (p.quantity || 1); i++) {
      expanded.push({ ...p, quantity: 1 });
    }
  });

  expanded.sort((a, b) => b.length - a.length);

  const bars: BarResult[] = [];
  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
    "#F97316",
  ];
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
          peso: piece.peso,
          posicao: piece.posicao,
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
        pieces: [
          {
            length: piece.length,
            color: colors[index % colors.length],
            label: piece.tag ? String(piece.tag) : `${piece.length}mm`,
            tag: piece.tag,
            conjunto: piece.conjunto,
            perfil: piece.perfil,
            peso: piece.peso,
            posicao: piece.posicao,
          },
        ],
        totalUsed: piece.length,
        waste: barLength - piece.length,
        originalLength: barLength,
      };
      bars.push(bar);
    }
  });

  // Filtrar barras vazias
  const filteredBars = bars.filter((bar) => bar.pieces.length > 0);

  const totalWaste = filteredBars.reduce((sum, b) => sum + b.waste, 0);
  const totalMaterial = filteredBars.reduce(
    (sum, b) => sum + b.originalLength,
    0
  );
  const wastePercentage =
    totalMaterial > 0 ? (totalWaste / totalMaterial) * 100 : 0;

  return {
    bars: filteredBars,
    totalBars: filteredBars.length,
    totalWaste,
    wastePercentage,
    efficiency: 100 - wastePercentage,
  };
}

export interface LeftoverStockItem {
  id: string;
  comprimento: number;
  quantidade: number;
  id_perfis_materiais?: string;
  perfis_materiais: PerfilMaterial;
}

export interface LinearOptimizationWithLeftoversResult
  extends LinearOptimizationResult {
  leftoverUsage: Record<string, string>;
}

export function runLinearOptimizationWithLeftovers(
  pieces: PieceInput[],
  barLength: number,
  leftovers: LeftoverStockItem[]
): LinearOptimizationWithLeftoversResult {
  const expandedPieces: PieceInput[] = [];
  pieces.forEach((p) => {
    for (let i = 0; i < (p.quantity || 1); i++) {
      expandedPieces.push({ ...p, quantity: 1 });
    }
  });
  expandedPieces.sort((a, b) => b.length - a.length);

  const expandedLeftovers = leftovers
    .flatMap((s) =>
      Array.from({ length: s.quantidade }).map((_, i) => ({
        ...s,
        uid: `${s.id}-${i}`,
      }))
    )
    .filter((l) => l.comprimento >= 100)
    .sort((a, b) => b.comprimento - a.comprimento);

  const bars: any[] = [];
  const cutLoss = 3;
  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
    "#F97316",
  ];
  const usedLeftovers = new Set<string>();
  const usage: Record<string, string> = {};
  let leftoverCount = 0;

  for (const piece of [...expandedPieces]) {
    let placed = false;
    for (const sob of expandedLeftovers) {
      if (usedLeftovers.has(sob.uid)) continue;
      let bar = bars.find(
        (b) => b.type === "leftover" && b.estoque_id === sob.uid
      );
      if (!bar) {
        bar = {
          id: `left-${sob.uid}`,
          type: "leftover",
          originalLength: sob.comprimento,
          pieces: [],
          waste: 0,
          totalUsed: 0,
          estoque_id: sob.id,
        };
        bars.push(bar);
        leftoverCount++;
        usage[sob.id] = String(parseInt(usage[sob.id] || "0", 10) + 1);
      }
      const available = sob.comprimento - bar.totalUsed;
      const need = piece.length + (bar.pieces.length > 0 ? cutLoss : 0);
      if (available >= need) {
        bar.pieces.push({
          length: piece.length,
          color: colors[Math.floor(Math.random() * colors.length)],
          label: piece.tag ? String(piece.tag) : `${piece.length}mm`,
          tag: piece.tag,
          conjunto: piece.conjunto,
          perfil: piece.perfil,
          peso: piece.peso,
          posicao: piece.posicao,
        });
        bar.totalUsed += need;
        bar.waste = sob.comprimento - bar.totalUsed;
        usedLeftovers.add(sob.uid);
        const index = expandedPieces.indexOf(piece);
        if (index > -1) expandedPieces.splice(index, 1);
        placed = true;
        break;
      }
    }
  }

  for (const piece of expandedPieces) {
    let placed = false;
    for (const bar of bars.filter((b) => b.type === "new")) {
      const available = barLength - bar.totalUsed;
      const need = piece.length + (bar.pieces.length > 0 ? cutLoss : 0);
      if (available >= need) {
        bar.pieces.push({
          length: piece.length,
          color: colors[Math.floor(Math.random() * colors.length)],
          label: piece.tag ? String(piece.tag) : `${piece.length}mm`,
          tag: piece.tag,
          conjunto: piece.conjunto,
          perfil: piece.perfil,
          peso: piece.peso,
          posicao: piece.posicao,
        });
        bar.totalUsed += need;
        bar.waste = barLength - bar.totalUsed;
        placed = true;
        break;
      }
    }
    if (!placed) {
      const bar = {
        id: `new-${bars.filter((b) => b.type === "new").length + 1}`,
        type: "new",
        originalLength: barLength,
        pieces: [
          {
            length: piece.length,
            color: colors[Math.floor(Math.random() * colors.length)],
            label: piece.tag ? String(piece.tag) : `${piece.length}mm`,
            tag: piece.tag,
            conjunto: piece.conjunto,
            perfil: piece.perfil,
            peso: piece.peso,
            posicao: piece.posicao,
          },
        ],
        waste: barLength - piece.length,
        totalUsed: piece.length,
      };
      bars.push(bar);
    }
  }

  // Filtrar barras vazias
  const filteredBars = bars.filter((bar) => bar.pieces.length > 0);

  const totalWaste = filteredBars.reduce((s, b) => s + b.waste, 0);
  const totalMaterial = filteredBars.reduce((s, b) => s + b.originalLength, 0);
  const wastePercentage =
    totalMaterial > 0 ? (totalWaste / totalMaterial) * 100 : 0;

  return {
    bars: filteredBars,
    totalBars: filteredBars.length,
    totalWaste,
    wastePercentage,
    efficiency: 100 - wastePercentage,
    leftoverUsage: usage,
  };
}
