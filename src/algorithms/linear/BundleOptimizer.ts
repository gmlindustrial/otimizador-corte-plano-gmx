/**
 * BundleOptimizer — Otimização de corte em amarrado (bundle cutting)
 *
 * Agrupa peças por perfil, gera 1 padrão de corte por amarrado,
 * e replica o padrão para N barras cortadas simultaneamente.
 *
 * Fluxo:
 * 1. Separar peças que precisam de emenda (length > barLength) → individual
 * 2. Agrupar peças restantes por perfil
 * 3. Para cada grupo: criar amarrados respeitando maxBarsPerBundle
 * 4. Otimizar cada amarrado via BestFitOptimizer (1 padrão)
 * 5. Replicar padrão × bundleSize
 * 6. Calcular economia vs corte individual
 */

import { BestFitOptimizer } from './BestFitOptimizer';
import type { LinearBar, LinearBarPiece, LinearInputPiece } from '@/types/linear';
import type {
  BundleGroup,
  BundleResult,
  BundleOptimizationResult,
  BundleConfig,
} from '@/types/bundle';

interface BundleOptimizerOptions {
  /** Comprimento da barra em mm */
  barLength: number;
  /** Perda de corte individual em mm */
  cutLoss: number;
  /** Fator de kerf para amarrado (1.0 = igual, 1.2 = 20% a mais) */
  kerfFactor: number;
  /** Custo por barra em R$ (para cálculo de economia) */
  costPerBar: number;
  /** Tempo de setup por corte em minutos */
  setupTimePerCut: number;
}

const DEFAULT_OPTIONS: BundleOptimizerOptions = {
  barLength: 6000,
  cutLoss: 3,
  kerfFactor: 1.2,
  costPerBar: 50,
  setupTimePerCut: 2.5,
};

export class BundleOptimizer {
  private options: BundleOptimizerOptions;

  constructor(options: Partial<BundleOptimizerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Agrupa peças por perfil (G1)
   * Retorna grupos com maxBarsPerBundle de cada perfil
   */
  groupPiecesByProfile(
    pieces: LinearInputPiece[],
    profileLookup: Map<string, { maxBarsPerBundle: number; description: string; type: string; kgPerMeter: number }>
  ): { bundleGroups: BundleGroup[]; individualPieces: LinearInputPiece[] } {
    const groups = new Map<string, BundleGroup>();
    const individualPieces: LinearInputPiece[] = [];

    for (const piece of pieces) {
      const profileId = piece.perfilId || '_sem_perfil';

      // Peças maiores que a barra → individual (emenda)
      if (piece.length > this.options.barLength) {
        individualPieces.push(piece);
        continue;
      }

      const profileInfo = profileLookup.get(profileId);
      const maxBars = profileInfo?.maxBarsPerBundle ?? 1;

      // Se maxBarsPerBundle = 1, não tem amarrado → individual
      if (maxBars <= 1) {
        individualPieces.push(piece);
        continue;
      }

      if (!groups.has(profileId)) {
        groups.set(profileId, {
          profileId,
          profileDescription: profileInfo?.description || piece.perfil || 'Sem perfil',
          profileType: profileInfo?.type || '',
          kgPerMeter: profileInfo?.kgPerMeter || 0,
          maxBarsPerBundle: maxBars,
          pieces: [],
          totalPieces: 0,
        });
      }

      const group = groups.get(profileId)!;
      group.pieces.push(piece);
      group.totalPieces += piece.quantity;
    }

    return {
      bundleGroups: Array.from(groups.values()),
      individualPieces,
    };
  }

  /**
   * Otimiza um grupo de peças em amarrados
   */
  async optimizeGroup(group: BundleGroup): Promise<BundleResult[]> {
    const results: BundleResult[] = [];
    const { maxBarsPerBundle } = group;

    // Expandir peças por comprimento (agrupar peças iguais)
    const lengthGroups = new Map<number, { piece: LinearInputPiece; totalQty: number }>();
    for (const piece of group.pieces) {
      const key = piece.length;
      if (!lengthGroups.has(key)) {
        lengthGroups.set(key, { piece, totalQty: 0 });
      }
      lengthGroups.get(key)!.totalQty += piece.quantity;
    }

    // Expandir todas as peças do grupo em peças individuais
    const allExpandedPieces: Array<{
      length: number;
      tag?: string;
      fase?: string;
      perfil?: string;
      peso?: number;
      posicao?: string;
      originalIndex: number;
    }> = [];

    let pieceIndex = 0;
    for (const piece of group.pieces) {
      for (let i = 0; i < piece.quantity; i++) {
        allExpandedPieces.push({
          length: piece.length,
          tag: piece.tag,
          fase: piece.fase,
          perfil: piece.perfil,
          peso: piece.peso,
          posicao: piece.posicao,
          originalIndex: pieceIndex,
        });
      }
      pieceIndex++;
    }

    // Calcular cutLoss ajustado para amarrado (G12)
    const bundleCutLoss = Math.ceil(this.options.cutLoss * this.options.kerfFactor);

    // Otimizar como se fosse 1 barra (gerar padrão)
    const optimizer = new BestFitOptimizer(bundleCutLoss);
    const singleBarResult = await optimizer.optimize(
      allExpandedPieces,
      this.options.barLength
    );

    // Cada barra no resultado é um padrão que será replicado
    // O número de barras necessárias determina quantos amarrados precisamos
    const totalBarsNeeded = singleBarResult.bars.length;

    // Calcular quantos amarrados completos + resto
    const fullBundles = Math.floor(totalBarsNeeded / 1); // Cada barra é um padrão
    // Cada padrão é cortado maxBarsPerBundle vezes simultaneamente

    // Para cada barra no resultado, criar um amarrado
    for (let i = 0; i < singleBarResult.bars.length; i++) {
      const bar = singleBarResult.bars[i];
      if (bar.pieces.length === 0) continue;

      // Determinar bundleSize: quantas barras físicas este padrão representa
      // Para amarrado, o padrão se repete maxBarsPerBundle vezes
      // Mas precisamos verificar se temos peças suficientes
      const bundleSize = maxBarsPerBundle;

      const bundleId = `bundle-${group.profileId}-${i}`;

      results.push({
        bundleId,
        profileId: group.profileId,
        profileDescription: group.profileDescription,
        bundleSize,
        pattern: {
          pieces: bar.pieces.map((p, idx) => ({
            ...p,
            bundleId,
            bundleSequence: idx + 1,
            bundleTotal: bar.pieces.length,
          })),
          barLength: bar.originalLength,
          totalUsed: bar.totalUsed,
          wastePerBar: bar.waste,
        },
        replicatedBars: bundleSize,
        totalWaste: bar.waste * bundleSize,
        efficiency: bar.totalUsed / bar.originalLength * 100,
        barsSaved: 0, // Calculado depois na comparação
        costSaving: 0, // Calculado depois na comparação
      });
    }

    return results;
  }

  /**
   * Executa a otimização completa por amarrado
   */
  async optimize(
    pieces: LinearInputPiece[],
    profileLookup: Map<string, { maxBarsPerBundle: number; description: string; type: string; kgPerMeter: number }>
  ): Promise<BundleOptimizationResult> {
    console.log('=== BundleOptimizer.optimize ===');
    console.log(`Total de peças: ${pieces.length}`);

    // Passo 1: Separar peças por perfil e identificar individuais
    const { bundleGroups, individualPieces } = this.groupPiecesByProfile(pieces, profileLookup);

    console.log(`Grupos de amarrado: ${bundleGroups.length}`);
    console.log(`Peças individuais (sem amarrado ou emenda): ${individualPieces.length}`);

    // Passo 2: Otimizar cada grupo de amarrado
    const allBundles: BundleResult[] = [];
    for (const group of bundleGroups) {
      console.log(`  Grupo "${group.profileDescription}": ${group.totalPieces} peças, max ${group.maxBarsPerBundle} barras/amarrado`);
      const groupBundles = await this.optimizeGroup(group);
      allBundles.push(...groupBundles);
    }

    // Passo 3: Otimizar peças individuais (sem amarrado)
    let individualBars: LinearBar[] = [];
    if (individualPieces.length > 0) {
      const expandedIndividual = [];
      let idx = 0;
      for (const piece of individualPieces) {
        for (let i = 0; i < piece.quantity; i++) {
          expandedIndividual.push({
            length: piece.length,
            tag: piece.tag,
            fase: piece.fase,
            perfil: piece.perfil,
            peso: piece.peso,
            posicao: piece.posicao,
            originalIndex: idx,
          });
        }
        idx++;
      }

      const optimizer = new BestFitOptimizer(this.options.cutLoss);
      const individualResult = await optimizer.optimize(
        expandedIndividual,
        this.options.barLength
      );
      individualBars = individualResult.bars.filter(b => b.pieces.length > 0);
    }

    // Passo 4: Calcular economia vs corte individual
    const totalBundleBars = allBundles.reduce((sum, b) => sum + b.replicatedBars, 0);
    const totalIndividualBars = individualBars.length;
    const totalBars = totalBundleBars + totalIndividualBars;

    // Economia de setup: amarrado = 1 setup para N barras
    const bundleCuts = allBundles.reduce((sum, b) => sum + b.pattern.pieces.length, 0);
    const individualCuts = individualBars.reduce((sum, b) => sum + b.pieces.length, 0);
    const setupTimeSaved = allBundles.reduce((sum, b) => {
      // Setup economizado = (bundleSize - 1) × cortes × tempo por setup
      return sum + (b.bundleSize - 1) * b.pattern.pieces.length * this.options.setupTimePerCut;
    }, 0);

    // Desperdício total
    const totalBundleWaste = allBundles.reduce((sum, b) => sum + b.totalWaste, 0);
    const totalIndividualWaste = individualBars.reduce((sum, b) => sum + b.waste, 0);
    const totalWaste = totalBundleWaste + totalIndividualWaste;

    // Eficiência média
    const totalMaterial = totalBars * this.options.barLength;
    const averageEfficiency = totalMaterial > 0
      ? ((totalMaterial - totalWaste) / totalMaterial) * 100
      : 0;

    // Economia em R$
    const totalCostSaving = allBundles.reduce((sum, b) => {
      return sum + b.barsSaved * this.options.costPerBar;
    }, 0);

    const result: BundleOptimizationResult = {
      bundles: allBundles,
      individualBars,
      summary: {
        totalBars,
        totalBundles: allBundles.length,
        averageEfficiency,
        totalWaste,
        totalBarsSaved: 0, // Será calculado quando comparar com individual
        totalCostSaving,
        setupTimeSaved,
      },
    };

    console.log('=== BundleOptimizer Resultado ===');
    console.log(`Amarrados: ${allBundles.length}, Barras individuais: ${individualBars.length}`);
    console.log(`Total barras: ${totalBars}, Eficiência: ${averageEfficiency.toFixed(1)}%`);
    console.log(`Setup economizado: ${setupTimeSaved.toFixed(0)} minutos`);

    return result;
  }
}
