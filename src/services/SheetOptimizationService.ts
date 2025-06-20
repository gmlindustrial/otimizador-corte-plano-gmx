
import type { SheetCutPiece, SheetProject, SheetOptimizationResult } from '@/types/sheet';
import { BottomLeftFill } from '@/algorithms/sheet/BottomLeftFill';
import { GeneticOptimizer } from '@/algorithms/sheet/GeneticOptimizer';
import { MultiObjectiveOptimizer } from '@/algorithms/sheet/MultiObjectiveOptimizer';

export class SheetOptimizationService {
  private bottomLeftFill: BottomLeftFill;
  private geneticOptimizer: GeneticOptimizer;
  private multiObjectiveOptimizer: MultiObjectiveOptimizer;

  constructor() {
    this.bottomLeftFill = new BottomLeftFill();
    this.geneticOptimizer = new GeneticOptimizer();
    this.multiObjectiveOptimizer = new MultiObjectiveOptimizer();
  }

  // Otimização principal (Multi-Objetivo por padrão)
  async optimize(pieces: SheetCutPiece[], project: SheetProject): Promise<SheetOptimizationResult> {
    const sheetSize = { width: project.sheetWidth, height: project.sheetHeight };
    
    // Usar algoritmo multi-objetivo como padrão
    const result = await this.multiObjectiveOptimizer.optimize(pieces, sheetSize, {
      kerf: project.kerf,
      thickness: project.thickness,
      process: project.process,
      material: project.material
    });

    // Calcular métricas adicionais
    const totalArea = sheetSize.width * sheetSize.height * result.totalSheets;
    const usedArea = result.sheets.reduce((sum, sheet) => sum + sheet.utilizedArea, 0);
    
    return {
      ...result,
      averageEfficiency: (usedArea / totalArea) * 100,
      totalWasteArea: totalArea - usedArea,
      materialCost: this.calculateMaterialCost(result.totalWeight, project.material),
      totalWeight: this.calculateTotalWeight(result.totalSheets, sheetSize, project.thickness, project.material)
    };
  }

  // Comparar algoritmos
  async compareAlgorithms(pieces: SheetCutPiece[], project: SheetProject): Promise<{
    blf: SheetOptimizationResult;
    genetic: SheetOptimizationResult;
    comparison: any;
  }> {
    const sheetSize = { width: project.sheetWidth, height: project.sheetHeight };
    
    // Executar BLF
    const blfResult = await this.bottomLeftFill.optimize(pieces, sheetSize, {
      kerf: project.kerf
    });

    // Executar Genetic
    const geneticResult = await this.geneticOptimizer.optimize(pieces, sheetSize, {
      kerf: project.kerf,
      generations: 50,
      populationSize: 30
    });

    // Calcular métricas para ambos
    const blfFinal = this.enhanceResult(blfResult, sheetSize, project);
    const geneticFinal = this.enhanceResult(geneticResult, sheetSize, project);

    const comparison = {
      efficiency: {
        blf: blfFinal.averageEfficiency,
        genetic: geneticFinal.averageEfficiency,
        winner: blfFinal.averageEfficiency > geneticFinal.averageEfficiency ? 'BLF' : 'Genetic'
      },
      sheets: {
        blf: blfFinal.totalSheets,
        genetic: geneticFinal.totalSheets,
        winner: blfFinal.totalSheets < geneticFinal.totalSheets ? 'BLF' : 'Genetic'
      },
      cost: {
        blf: blfFinal.materialCost,
        genetic: geneticFinal.materialCost,
        winner: blfFinal.materialCost < geneticFinal.materialCost ? 'BLF' : 'Genetic'
      }
    };

    return {
      blf: blfFinal,
      genetic: geneticFinal,
      comparison
    };
  }

  // Validar peças antes da otimização
  validatePieces(pieces: SheetCutPiece[], project: SheetProject): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações básicas
    pieces.forEach((piece, index) => {
      if (piece.width <= 0 || piece.height <= 0) {
        errors.push(`Peça ${index + 1} (${piece.tag}): Dimensões inválidas`);
      }

      if (piece.quantity <= 0) {
        errors.push(`Peça ${index + 1} (${piece.tag}): Quantidade deve ser maior que 0`);
      }

      if (!piece.tag || piece.tag.trim() === '') {
        errors.push(`Peça ${index + 1}: Tag obrigatória`);
      }

      // Verificar se peça cabe na chapa
      const maxDim = Math.max(piece.width, piece.height);
      const minDim = Math.min(piece.width, piece.height);
      const sheetMaxDim = Math.max(project.sheetWidth, project.sheetHeight);
      const sheetMinDim = Math.min(project.sheetWidth, project.sheetHeight);

      if (maxDim > sheetMaxDim || minDim > sheetMinDim) {
        if (!piece.allowRotation || (piece.width > sheetMaxDim || piece.height > sheetMaxDim)) {
          errors.push(`Peça ${piece.tag}: Não cabe na chapa (${piece.width}x${piece.height}mm)`);
        }
      }

      // Avisos
      const pieceArea = piece.width * piece.height;
      const sheetArea = project.sheetWidth * project.sheetHeight;
      
      if (pieceArea > sheetArea * 0.8) {
        warnings.push(`Peça ${piece.tag}: Muito grande (>80% da chapa), pode reduzir eficiência`);
      }

      if (piece.width < 50 || piece.height < 50) {
        warnings.push(`Peça ${piece.tag}: Muito pequena, considere agrupar peças similares`);
      }
    });

    // Verificar tags duplicadas
    const tags = pieces.map(p => p.tag);
    const duplicateTags = tags.filter((tag, index) => tags.indexOf(tag) !== index);
    if (duplicateTags.length > 0) {
      warnings.push(`Tags duplicadas encontradas: ${[...new Set(duplicateTags)].join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Calcular estatísticas do projeto
  calculateProjectStats(pieces: SheetCutPiece[], project: SheetProject) {
    const totalPieces = pieces.reduce((sum, piece) => sum + piece.quantity, 0);
    const totalArea = pieces.reduce((sum, piece) => sum + (piece.width * piece.height * piece.quantity), 0);
    
    const sheetArea = project.sheetWidth * project.sheetHeight;
    const estimatedSheets = Math.ceil(totalArea / (sheetArea * 0.85)); // 85% de eficiência estimada
    
    const estimatedWeight = this.calculateTotalWeight(estimatedSheets, 
      { width: project.sheetWidth, height: project.sheetHeight }, 
      project.thickness, 
      project.material
    );
    
    const estimatedCost = this.calculateMaterialCost(estimatedWeight, project.material);

    return {
      totalPieces,
      totalArea,
      estimatedSheets,
      estimatedWeight,
      estimatedCost
    };
  }

  // Método auxiliar para enriquecer resultados
  private enhanceResult(result: SheetOptimizationResult, sheetSize: { width: number; height: number }, project: SheetProject): SheetOptimizationResult {
    const totalArea = sheetSize.width * sheetSize.height * result.totalSheets;
    const usedArea = result.sheets.reduce((sum, sheet) => sum + sheet.utilizedArea, 0);
    
    return {
      ...result,
      averageEfficiency: (usedArea / totalArea) * 100,
      totalWasteArea: totalArea - usedArea,
      materialCost: this.calculateMaterialCost(result.totalWeight, project.material),
      totalWeight: this.calculateTotalWeight(result.totalSheets, sheetSize, project.thickness, project.material)
    };
  }

  // Calcular peso total
  private calculateTotalWeight(totalSheets: number, sheetSize: { width: number; height: number }, thickness: number, material: string): number {
    const sheetArea = (sheetSize.width * sheetSize.height) / 1000000; // m²
    const volume = sheetArea * (thickness / 1000); // m³
    
    // Densidade dos materiais (kg/m³)
    const densities: { [key: string]: number } = {
      'A36': 7850,
      'A572': 7850,
      'A516': 7850,
      'ASTM A36': 7850,
      'default': 7850
    };
    
    const density = densities[material] || densities.default;
    const sheetWeight = volume * density;
    
    return totalSheets * sheetWeight;
  }

  // Calcular custo do material
  private calculateMaterialCost(weight: number, material: string): number {
    // Preços por kg (valores exemplificativos)
    const prices: { [key: string]: number } = {
      'A36': 4.50,
      'A572': 5.20,
      'A516': 5.80,
      'ASTM A36': 4.50,
      'default': 4.50
    };
    
    const pricePerKg = prices[material] || prices.default;
    return weight * pricePerKg;
  }
}

// Instância singleton do serviço
export const sheetOptimizationService = new SheetOptimizationService();
