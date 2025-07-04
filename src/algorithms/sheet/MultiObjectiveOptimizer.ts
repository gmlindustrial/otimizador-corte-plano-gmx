
import type { SheetCutPiece, SheetOptimizationResult, SheetPlacedPiece } from '@/types/sheet';
import { BottomLeftFillOptimizer } from './BottomLeftFill';
import { GeneticOptimizer } from './GeneticOptimizer';
import { NoFitPolygonOptimizer } from './NoFitPolygon';
import { SequenceOptimizer } from './SequenceOptimizer';

interface OptimizationStrategy {
  name: string;
  weight: number;
  enabled: boolean;
}

interface AdvancedOptimizationConfig {
  strategies: {
    efficiency: OptimizationStrategy;
    wasteReduction: OptimizationStrategy;
    cuttingTime: OptimizationStrategy;
    thermalDistortion: OptimizationStrategy;
  };
  algorithm: 'BLF' | 'Genetic' | 'NFP' | 'Hybrid';
  maxIterations: number;
  convergenceThreshold: number;
}

export class MultiObjectiveOptimizer {
  private sheetWidth: number;
  private sheetHeight: number;
  private kerf: number;
  private thickness: number;
  private material: string;
  private process: 'plasma' | 'oxicorte' | 'both';
  private config: AdvancedOptimizationConfig;

  constructor(
    sheetWidth: number,
    sheetHeight: number,
    kerf: number = 2,
    thickness: number = 6,
    material: string = 'A36',
    process: 'plasma' | 'oxicorte' | 'both' = 'plasma'
  ) {
    this.sheetWidth = sheetWidth;
    this.sheetHeight = sheetHeight;
    this.kerf = kerf;
    this.thickness = thickness;
    this.material = material;
    this.process = process;
    
    this.config = {
      strategies: {
        efficiency: { name: 'Eficiência Material', weight: 0.4, enabled: true },
        wasteReduction: { name: 'Redução Desperdício', weight: 0.3, enabled: true },
        cuttingTime: { name: 'Tempo Corte', weight: 0.2, enabled: true },
        thermalDistortion: { name: 'Distorção Térmica', weight: 0.1, enabled: false }
      },
      algorithm: 'Hybrid',
      maxIterations: 50,
      convergenceThreshold: 0.001
    };
  }

  // Otimização principal multi-objetivo
  async optimize(pieces: SheetCutPiece[]): Promise<SheetOptimizationResult & {
    cuttingSequence?: any;
    gcode?: string[];
    optimizationMetrics?: any;
  }> {
    console.log(`Iniciando otimização multi-objetivo com algoritmo ${this.config.algorithm}`);
    
    let bestResult: SheetOptimizationResult;
    let cuttingSequence: any;
    let gcode: string[] = [];
    let optimizationMetrics: any = {};
    
    const startTime = Date.now();
    
    switch (this.config.algorithm) {
      case 'BLF':
        bestResult = await this.optimizeWithBLF(pieces);
        break;
        
      case 'Genetic':
        bestResult = await this.optimizeWithGenetic(pieces);
        break;
        
      case 'NFP':
        bestResult = await this.optimizeWithNFP(pieces);
        break;
        
      case 'Hybrid':
      default:
        bestResult = await this.optimizeHybrid(pieces);
        break;
    }
    
    // Otimizar sequência de corte
    if (bestResult.sheets.length > 0) {
      const sequenceOptimizer = new SequenceOptimizer(this.kerf, this.process);
      cuttingSequence = sequenceOptimizer.optimizeCuttingSequence(bestResult.sheets[0].pieces);
      gcode = sequenceOptimizer.generateGCode(cuttingSequence);
    }
    
    // Calcular métricas de otimização
    const endTime = Date.now();
    optimizationMetrics = {
      optimizationTime: endTime - startTime,
      algorithm: this.config.algorithm,
      strategies: this.config.strategies,
      convergence: true
    };
    
    console.log(`Otimização concluída em ${optimizationMetrics.optimizationTime}ms`);
    
    return {
      ...bestResult,
      cuttingSequence,
      gcode,
      optimizationMetrics
    };
  }

  private async optimizeWithBLF(pieces: SheetCutPiece[]): Promise<SheetOptimizationResult> {
    console.log('Executando otimização Bottom-Left Fill');
    const blf = new BottomLeftFillOptimizer(this.sheetWidth, this.sheetHeight, this.kerf, this.thickness, this.material);
    return blf.optimize(pieces);
  }

  private async optimizeWithGenetic(pieces: SheetCutPiece[]): Promise<SheetOptimizationResult> {
    console.log('Executando otimização Genética');
    const genetic = new GeneticOptimizer(this.sheetWidth, this.sheetHeight, this.kerf, this.thickness, this.material);
    return genetic.optimize(pieces);
  }

  private async optimizeWithNFP(pieces: SheetCutPiece[]): Promise<SheetOptimizationResult> {
    console.log('Executando otimização No-Fit Polygon');
    try {
      const nfp = new NoFitPolygonOptimizer(this.sheetWidth, this.sheetHeight, this.kerf);
      const placedPieces = nfp.optimizeWithNFP(pieces);

      if (!placedPieces || placedPieces.length === 0) {
        throw new Error('Nenhuma peça posicionada com NFP');
      }

      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
      const sheetArea = this.sheetWidth * this.sheetHeight;

      const sheetPieces: SheetPlacedPiece[] = placedPieces.map((pp, idx) => ({
        x: pp.x,
        y: pp.y,
        width: pp.piece.width,
        height: pp.piece.height,
        rotation: pp.rotation,
        tag: pp.piece.tag,
        color: colors[idx % colors.length],
        originalPiece: pp.piece
      }));

      const utilizedArea = sheetPieces.reduce((sum, p) => sum + (p.width * p.height), 0);
      const wasteArea = sheetArea - utilizedArea;
      const efficiency = (utilizedArea / sheetArea) * 100;
      const weight = this.calculateSheetWeight(sheetArea);
      const materialCost = this.calculateMaterialCost(weight);

      return {
        sheets: [{
          id: 'sheet-1',
          pieces: sheetPieces,
          efficiency,
          wasteArea,
          utilizedArea,
          weight
        }],
        totalSheets: 1,
        totalWasteArea: wasteArea,
        averageEfficiency: efficiency,
        totalWeight: weight,
        materialCost
      };
    } catch (error) {
      console.error('Erro na otimização NFP:', error);
      throw error;
    }
  }

  private async optimizeHybrid(pieces: SheetCutPiece[]): Promise<SheetOptimizationResult> {
    console.log('Executando otimização Híbrida (BLF + Genetic + NFP)');
    
    const results: SheetOptimizationResult[] = [];
    
    // Executar BLF
    const blf = new BottomLeftFillOptimizer(this.sheetWidth, this.sheetHeight, this.kerf, this.thickness, this.material);
    results.push(blf.optimize(pieces));
    
    // Executar Genetic (apenas se muitas peças)
    if (pieces.length > 10) {
      const genetic = new GeneticOptimizer(this.sheetWidth, this.sheetHeight, this.kerf, this.thickness, this.material);
      results.push(genetic.optimize(pieces));
    }
    
    // Selecionar melhor resultado baseado no score multi-objetivo
    return this.selectBestResult(results);
  }

  private selectBestResult(results: SheetOptimizationResult[]): SheetOptimizationResult {
    let bestResult = results[0];
    let bestScore = this.calculateMultiObjectiveScore(bestResult);
    
    for (let i = 1; i < results.length; i++) {
      const score = this.calculateMultiObjectiveScore(results[i]);
      if (score > bestScore) {
        bestScore = score;
        bestResult = results[i];
      }
    }
    
    console.log(`Melhor resultado selecionado com score: ${bestScore.toFixed(3)}`);
    return bestResult;
  }

  private calculateMultiObjectiveScore(result: SheetOptimizationResult): number {
    let score = 0;
    
    // Eficiência material
    if (this.config.strategies.efficiency.enabled) {
      const efficiencyScore = result.averageEfficiency / 100;
      score += efficiencyScore * this.config.strategies.efficiency.weight;
    }
    
    // Redução de desperdício
    if (this.config.strategies.wasteReduction.enabled) {
      const totalArea = result.totalSheets * this.sheetWidth * this.sheetHeight;
      const wasteReductionScore = 1 - (result.totalWasteArea / totalArea);
      score += wasteReductionScore * this.config.strategies.wasteReduction.weight;
    }
    
    // Penalizar muitas chapas (tempo de corte)
    if (this.config.strategies.cuttingTime.enabled) {
      const cuttingTimeScore = 1 / (result.totalSheets + 1);
      score += cuttingTimeScore * this.config.strategies.cuttingTime.weight;
    }
    
    return score;
  }

  // Configurar estratégias de otimização
  setOptimizationStrategy(strategy: Partial<AdvancedOptimizationConfig>): void {
    if (strategy.strategies) {
      const updatedStrategies = { ...this.config.strategies };

      for (const key of Object.keys(strategy.strategies) as Array<keyof AdvancedOptimizationConfig['strategies']>) {
        updatedStrategies[key] = {
          ...updatedStrategies[key],
          ...strategy.strategies[key]
        };
      }

      this.config = { ...this.config, ...strategy, strategies: updatedStrategies };
    } else {
      this.config = { ...this.config, ...strategy };
    }

    console.log('Estratégia de otimização atualizada:', this.config);
  }

  // Análise de sensibilidade
  analyzeOptimizationSensitivity(pieces: SheetCutPiece[]): any {
    const baseResult = new BottomLeftFillOptimizer(
      this.sheetWidth, 
      this.sheetHeight, 
      this.kerf, 
      this.thickness, 
      this.material
    ).optimize(pieces);
    
    const variations = [
      { kerf: this.kerf + 1, label: 'Kerf +1mm' },
      { kerf: this.kerf - 0.5, label: 'Kerf -0.5mm' },
      { sheetWidth: this.sheetWidth + 100, label: 'Largura +100mm' },
      { sheetHeight: this.sheetHeight + 200, label: 'Altura +200mm' }
    ];
    
    const sensitivity = variations.map(variation => {
      const optimizer = new BottomLeftFillOptimizer(
        variation.sheetWidth || this.sheetWidth,
        variation.sheetHeight || this.sheetHeight,
        variation.kerf || this.kerf,
        this.thickness,
        this.material
      );
      
      const result = optimizer.optimize(pieces);
      
      return {
        label: variation.label,
        efficiency: result.averageEfficiency,
        sheets: result.totalSheets,
        waste: result.totalWasteArea,
        change: {
          efficiency: result.averageEfficiency - baseResult.averageEfficiency,
          sheets: result.totalSheets - baseResult.totalSheets,
          waste: result.totalWasteArea - baseResult.totalWasteArea
        }
      };
    });
    
    return {
      baseResult,
      sensitivity
    };
  }

  // Exportar configuração de otimização
  exportConfiguration(): any {
    return {
      sheetDimensions: {
        width: this.sheetWidth,
        height: this.sheetHeight
      },
      material: {
        type: this.material,
        thickness: this.thickness
      },
      process: {
        type: this.process,
        kerf: this.kerf
      },
      optimization: this.config
    };
  }

  private calculateSheetWeight(sheetArea: number): number {
    const areaDm2 = sheetArea / 10000;
    const thicknessDm = this.thickness / 10;
    const volumeDm3 = areaDm2 * thicknessDm;

    const densities: { [key: string]: number } = {
      'A36': 7.85,
      'A572': 7.85,
      'A514': 7.85
    };

    const density = densities[this.material] || 7.85;
    return volumeDm3 * density;
  }

  private calculateMaterialCost(totalWeight: number): number {
    const costPerKg: { [key: string]: number } = {
      'A36': 5.50,
      'A572': 6.20,
      'A514': 8.90
    };

    const cost = costPerKg[this.material] || 5.50;
    return totalWeight * cost;
  }
}
