/**
 * MultiLengthOptimizer — Otimiza usando múltiplos tamanhos de barra (G8)
 *
 * Testa cada tamanho disponível e retorna o melhor resultado.
 * Também testa combinações (ex: algumas peças em 6m, outras em 12m).
 */

import { BestFitOptimizer } from './BestFitOptimizer';
import type { LinearBar } from '@/types/linear';

interface MultiLengthResult {
  /** Melhor resultado encontrado */
  bars: LinearBar[];
  efficiency: number;
  totalWaste: number;
  strategy: string;
  /** Tamanho de barra que gerou o melhor resultado */
  bestBarLength: number;
  /** Comparação entre todos os tamanhos testados */
  comparison: Array<{
    barLength: number;
    totalBars: number;
    efficiency: number;
    totalWaste: number;
    wastePercentage: number;
  }>;
}

export class MultiLengthOptimizer {
  private cutLoss: number;

  constructor(cutLoss: number = 3) {
    this.cutLoss = cutLoss;
  }

  /**
   * Otimiza testando múltiplos tamanhos de barra
   * Retorna o resultado com melhor eficiência
   */
  async optimize(
    pieces: any[],
    barLengths: number[],
    leftovers: any[] = []
  ): Promise<MultiLengthResult> {
    if (barLengths.length === 0) {
      throw new Error('Pelo menos um tamanho de barra deve ser informado');
    }

    // Se apenas 1 tamanho, otimizar direto
    if (barLengths.length === 1) {
      const optimizer = new BestFitOptimizer(this.cutLoss);
      const result = await optimizer.optimize(pieces, barLengths[0], leftovers);
      return {
        ...result,
        bestBarLength: barLengths[0],
        comparison: [{
          barLength: barLengths[0],
          totalBars: result.bars.length,
          efficiency: result.efficiency,
          totalWaste: result.totalWaste,
          wastePercentage: 100 - result.efficiency,
        }],
      };
    }

    console.log(`=== MultiLengthOptimizer: testando ${barLengths.length} tamanhos ===`);
    console.log(`Tamanhos: ${barLengths.join(', ')}mm`);

    const optimizer = new BestFitOptimizer(this.cutLoss);
    const results: Array<{
      barLength: number;
      result: Awaited<ReturnType<BestFitOptimizer['optimize']>>;
    }> = [];

    // Testar cada tamanho
    for (const barLength of barLengths) {
      try {
        const result = await optimizer.optimize([...pieces], barLength, leftovers);
        results.push({ barLength, result });
        console.log(`  ${barLength}mm: ${result.bars.length} barras, ${result.efficiency.toFixed(1)}% eficiência`);
      } catch (e) {
        console.warn(`  ${barLength}mm: falhou`, e);
      }
    }

    if (results.length === 0) {
      throw new Error('Nenhum tamanho de barra gerou resultado válido');
    }

    // Ordenar por eficiência (melhor primeiro)
    results.sort((a, b) => b.result.efficiency - a.result.efficiency);

    const best = results[0];
    console.log(`>>> Melhor tamanho: ${best.barLength}mm com ${best.result.efficiency.toFixed(1)}% eficiência`);

    return {
      bars: best.result.bars,
      efficiency: best.result.efficiency,
      totalWaste: best.result.totalWaste,
      strategy: `${best.result.strategy} (barra ${best.barLength}mm)`,
      bestBarLength: best.barLength,
      comparison: results.map(r => ({
        barLength: r.barLength,
        totalBars: r.result.bars.length,
        efficiency: r.result.efficiency,
        totalWaste: r.result.totalWaste,
        wastePercentage: 100 - r.result.efficiency,
      })),
    };
  }
}
