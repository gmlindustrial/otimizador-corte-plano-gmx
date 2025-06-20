
import { supabase } from '@/integrations/supabase/client';
import { MultiObjectiveOptimizer } from '@/algorithms/sheet/MultiObjectiveOptimizer';
import { BottomLeftFillOptimizer } from '@/algorithms/sheet/BottomLeftFill';
import { GeneticOptimizer } from '@/algorithms/sheet/GeneticOptimizer';
import type { SheetCutPiece, SheetProject, SheetOptimizationResult } from '@/types/sheet';

interface OptimizationHistory {
  id: string;
  project_id: string;
  project_name: string;
  pieces: SheetCutPiece[];
  results: SheetOptimizationResult;
  algorithm: string;
  optimization_time: number;
  created_at: string;
  efficiency: number;
  total_sheets: number;
  total_weight: number;
  material_cost: number;
}

class SheetOptimizationService {
  // Otimização principal usando MultiObjectiveOptimizer
  async optimize(pieces: SheetCutPiece[], project: SheetProject): Promise<SheetOptimizationResult> {
    try {
      console.log('Iniciando otimização de chapas...');
      
      const optimizer = new MultiObjectiveOptimizer(
        project.sheetWidth,
        project.sheetHeight,
        project.kerf,
        project.thickness,
        project.material,
        project.process
      );

      const result = await optimizer.optimize(pieces);
      
      console.log('Otimização concluída:', result);
      return result;
    } catch (error) {
      console.error('Erro na otimização:', error);
      throw new Error('Falha na otimização de chapas');
    }
  }

  // Validar peças antes da otimização
  validatePieces(pieces: SheetCutPiece[], project: SheetProject): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    pieces.forEach((piece, index) => {
      // Validar dimensões
      if (piece.width <= 0 || piece.height <= 0) {
        errors.push(`Peça ${index + 1} (${piece.tag}): Dimensões inválidas`);
      }

      // Verificar se a peça cabe na chapa
      const fitsNormal = piece.width <= project.sheetWidth && piece.height <= project.sheetHeight;
      const fitsRotated = piece.allowRotation && piece.height <= project.sheetWidth && piece.width <= project.sheetHeight;

      if (!fitsNormal && !fitsRotated) {
        errors.push(`Peça ${piece.tag}: Não cabe na chapa (${piece.width}×${piece.height}mm)`);
      }

      // Avisos para peças grandes
      const pieceArea = piece.width * piece.height;
      const sheetArea = project.sheetWidth * project.sheetHeight;
      const areaRatio = pieceArea / sheetArea;

      if (areaRatio > 0.8) {
        warnings.push(`Peça ${piece.tag}: Muito grande (${(areaRatio * 100).toFixed(1)}% da chapa)`);
      }

      // Verificar tag duplicada
      const duplicateTags = pieces.filter(p => p.tag === piece.tag);
      if (duplicateTags.length > 1) {
        errors.push(`Tag duplicada: ${piece.tag}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Calcular estatísticas do projeto
  calculateProjectStats(pieces: SheetCutPiece[], project: SheetProject): {
    totalPieces: number;
    totalArea: number;
    estimatedSheets: number;
    estimatedWeight: number;
    estimatedCost: number;
  } {
    const totalPieces = pieces.reduce((sum, piece) => sum + piece.quantity, 0);
    const totalArea = pieces.reduce((sum, piece) => sum + (piece.width * piece.height * piece.quantity), 0);
    
    const sheetArea = project.sheetWidth * project.sheetHeight;
    const estimatedEfficiency = 0.75; // 75% de eficiência estimada
    const estimatedSheets = Math.ceil(totalArea / (sheetArea * estimatedEfficiency));
    
    // Calcular peso (densidade do aço: ~7.85 kg/m³/mm)
    const density = 7.85; // kg/m³/mm
    const totalVolume = (totalArea / 1000000) * project.thickness; // m³
    const estimatedWeight = totalVolume * density;
    
    // Custo estimado (exemplo: R$ 8,00/kg para A36)
    const costPerKg = project.material === 'A572' ? 12.0 : 8.0;
    const estimatedCost = estimatedWeight * costPerKg;

    return {
      totalPieces,
      totalArea,
      estimatedSheets,
      estimatedWeight,
      estimatedCost
    };
  }

  // Comparar algoritmos
  async compareAlgorithms(pieces: SheetCutPiece[], project: SheetProject): Promise<{
    blf: SheetOptimizationResult;
    genetic: SheetOptimizationResult;
    comparison: {
      efficiency: { blf: number; genetic: number; winner: string };
      sheets: { blf: number; genetic: number; winner: string };
      waste: { blf: number; genetic: number; winner: string };
    };
  }> {
    try {
      console.log('Comparando algoritmos BLF vs Genetic...');
      
      // Executar BLF
      const blfOptimizer = new BottomLeftFillOptimizer(
        project.sheetWidth,
        project.sheetHeight,
        project.kerf,
        project.thickness,
        project.material
      );
      const blfResult = blfOptimizer.optimize(pieces);

      // Executar Genetic
      const geneticOptimizer = new GeneticOptimizer(
        project.sheetWidth,
        project.sheetHeight,
        project.kerf,
        project.thickness,
        project.material
      );
      const geneticResult = geneticOptimizer.optimize(pieces);

      // Comparar resultados
      const comparison = {
        efficiency: {
          blf: blfResult.averageEfficiency,
          genetic: geneticResult.averageEfficiency,
          winner: blfResult.averageEfficiency > geneticResult.averageEfficiency ? 'BLF' : 'Genetic'
        },
        sheets: {
          blf: blfResult.totalSheets,
          genetic: geneticResult.totalSheets,
          winner: blfResult.totalSheets < geneticResult.totalSheets ? 'BLF' : 'Genetic'
        },
        waste: {
          blf: blfResult.totalWasteArea,
          genetic: geneticResult.totalWasteArea,
          winner: blfResult.totalWasteArea < geneticResult.totalWasteArea ? 'BLF' : 'Genetic'
        }
      };

      console.log('Comparação concluída:', comparison);
      
      return {
        blf: blfResult,
        genetic: geneticResult,
        comparison
      };
    } catch (error) {
      console.error('Erro na comparação de algoritmos:', error);
      throw new Error('Falha na comparação de algoritmos');
    }
  }

  // Gerar relatório técnico
  generateTechnicalReport(result: SheetOptimizationResult, project: SheetProject): any {
    return {
      project: {
        name: project.name,
        number: project.projectNumber,
        material: project.material,
        thickness: project.thickness,
        process: project.process
      },
      optimization: {
        totalSheets: result.totalSheets,
        averageEfficiency: result.averageEfficiency,
        totalWeight: result.totalWeight,
        materialCost: result.materialCost,
        algorithm: result.optimizationMetrics?.algorithm || 'MultiObjective'
      },
      sheets: result.sheets.map((sheet, index) => ({
        number: index + 1,
        pieces: sheet.pieces.length,
        efficiency: sheet.efficiency,
        utilizedArea: sheet.utilizedArea,
        wasteArea: sheet.wasteArea,
        weight: sheet.weight
      })),
      summary: {
        totalPieces: result.sheets.reduce((sum, sheet) => sum + sheet.pieces.length, 0),
        totalUtilizedArea: result.sheets.reduce((sum, sheet) => sum + sheet.utilizedArea, 0),
        totalWasteArea: result.totalWasteArea,
        materialEfficiency: result.averageEfficiency
      }
    };
  }
}

export const sheetOptimizationService = new SheetOptimizationService();
