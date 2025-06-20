
import type { SheetCutPiece, SheetProject, SheetOptimizationResult } from '@/types/sheet';
import { MultiObjectiveOptimizer } from '@/algorithms/sheet/MultiObjectiveOptimizer';
import { supabase } from '@/integrations/supabase/client';

export interface OptimizationHistory {
  id: string;
  project_id: string;
  pieces: SheetCutPiece[];
  results: SheetOptimizationResult;
  algorithm: string;
  optimization_time: number;
  created_at: string;
}

export class SheetOptimizationService {
  private optimizer: MultiObjectiveOptimizer | null = null;

  // Configurar otimizador baseado no projeto
  configureOptimizer(project: SheetProject): void {
    this.optimizer = new MultiObjectiveOptimizer(
      project.sheetWidth,
      project.sheetHeight,
      project.kerf,
      project.thickness,
      project.material,
      project.process
    );

    console.log('Otimizador configurado para projeto:', project.name);
  }

  // Executar otimização
  async optimize(pieces: SheetCutPiece[], project: SheetProject): Promise<SheetOptimizationResult & {
    cuttingSequence?: any;
    gcode?: string[];
    optimizationMetrics?: any;
  }> {
    if (!this.optimizer) {
      this.configureOptimizer(project);
    }

    console.log('Iniciando otimização para', pieces.length, 'tipos de peças');
    
    const startTime = Date.now();
    const result = await this.optimizer!.optimize(pieces);
    const endTime = Date.now();

    // Salvar histórico no Supabase
    await this.saveOptimizationHistory(project.id, pieces, result, endTime - startTime);

    return result;
  }

  // Salvar histórico de otimização
  private async saveOptimizationHistory(
    projectId: string, 
    pieces: SheetCutPiece[], 
    results: SheetOptimizationResult,
    optimizationTime: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('sheet_optimization_history')
        .insert({
          project_id: projectId,
          pieces: pieces,
          results: results,
          algorithm: 'MultiObjective',
          optimization_time: optimizationTime
        });

      if (error) {
        console.error('Erro ao salvar histórico:', error);
      } else {
        console.log('Histórico de otimização salvo com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }

  // Recuperar histórico de otimizações
  async getOptimizationHistory(projectId: string): Promise<OptimizationHistory[]> {
    try {
      const { data, error } = await supabase
        .from('sheet_optimization_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao recuperar histórico:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao recuperar histórico:', error);
      return [];
    }
  }

  // Comparar diferentes algoritmos
  async compareAlgorithms(pieces: SheetCutPiece[], project: SheetProject): Promise<{
    blf: SheetOptimizationResult;
    genetic: SheetOptimizationResult;
    comparison: any;
  }> {
    this.configureOptimizer(project);

    console.log('Comparando algoritmos BLF vs Genetic');

    // Teste BLF
    this.optimizer!.setOptimizationStrategy({ algorithm: 'BLF' });
    const blfResult = await this.optimizer!.optimize(pieces);

    // Teste Genetic
    this.optimizer!.setOptimizationStrategy({ algorithm: 'Genetic' });
    const geneticResult = await this.optimizer!.optimize(pieces);

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
      // Verificar se cabe na chapa
      const fitsNormal = piece.width <= project.sheetWidth && piece.height <= project.sheetHeight;
      const fitsRotated = piece.allowRotation && 
                         piece.height <= project.sheetWidth && 
                         piece.width <= project.sheetHeight;

      if (!fitsNormal && !fitsRotated) {
        errors.push(`Peça ${piece.tag} (${piece.width}x${piece.height}mm) é muito grande para a chapa ${project.sheetWidth}x${project.sheetHeight}mm`);
      }

      // Verificar kerf vs dimensões
      if (piece.width < project.kerf * 3 || piece.height < project.kerf * 3) {
        warnings.push(`Peça ${piece.tag} é muito pequena para o kerf ${project.kerf}mm (mínimo recomendado: ${project.kerf * 3}mm)`);
      }

      // Verificar processo vs espessura
      if (project.process === 'plasma' && project.thickness > 50) {
        warnings.push(`Plasma pode não ser adequado para espessura ${project.thickness}mm. Considere oxicorte.`);
      }

      if (project.process === 'oxicorte' && project.thickness < 6) {
        warnings.push(`Oxicorte pode não ser adequado para espessura ${project.thickness}mm. Considere plasma.`);
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
    const estimatedSheets = Math.ceil(totalArea / (sheetArea * 0.85)); // 85% eficiência estimada
    
    const areaDm2 = (estimatedSheets * sheetArea) / 10000;
    const thicknessDm = project.thickness / 10;
    const volumeDm3 = areaDm2 * thicknessDm;
    const estimatedWeight = volumeDm3 * 7.85; // Densidade do aço
    
    const costPerKg = 5.50; // Custo exemplo
    const estimatedCost = estimatedWeight * costPerKg;

    return {
      totalPieces,
      totalArea,
      estimatedSheets,
      estimatedWeight,
      estimatedCost
    };
  }

  // Exportar dados para CAM/CNC
  exportForCAM(result: SheetOptimizationResult, project: SheetProject): {
    dxf: string;
    gcode: string[];
    report: string;
  } {
    const dxf = this.generateDXF(result, project);
    const gcode = result.gcode || [];
    const report = this.generateTechnicalReport(result, project);

    return {
      dxf,
      gcode,
      report
    };
  }

  private generateDXF(result: SheetOptimizationResult, project: SheetProject): string {
    // Gerar DXF básico - implementação simplificada
    let dxf = `0\nSECTION\n2\nENTITIES\n`;
    
    result.sheets.forEach((sheet, sheetIndex) => {
      sheet.pieces.forEach(piece => {
        dxf += `0\nRECTANGLE\n`;
        dxf += `10\n${piece.x}\n`;
        dxf += `20\n${piece.y}\n`;
        dxf += `11\n${piece.x + piece.width}\n`;
        dxf += `21\n${piece.y + piece.height}\n`;
        dxf += `8\n${piece.tag}\n`;
      });
    });
    
    dxf += `0\nENDSEC\n0\nEOF\n`;
    return dxf;
  }

  private generateTechnicalReport(result: SheetOptimizationResult, project: SheetProject): string {
    const report = `
RELATÓRIO TÉCNICO - OTIMIZAÇÃO DE CHAPAS
========================================

Projeto: ${project.name}
Número: ${project.projectNumber}
Cliente: ${project.client}
Data: ${new Date().toLocaleDateString('pt-BR')}

ESPECIFICAÇÕES DA CHAPA:
- Dimensões: ${project.sheetWidth}x${project.sheetHeight}mm
- Espessura: ${project.thickness}mm
- Material: ${project.material}
- Processo: ${project.process.toUpperCase()}
- Kerf: ${project.kerf}mm

RESULTADOS DA OTIMIZAÇÃO:
- Total de Chapas: ${result.totalSheets}
- Eficiência Média: ${result.averageEfficiency.toFixed(2)}%
- Área Desperdiçada: ${(result.totalWasteArea / 1000000).toFixed(2)} m²
- Peso Total: ${result.totalWeight.toFixed(2)} kg
- Custo Material: R$ ${result.materialCost.toFixed(2)}

DETALHAMENTO POR CHAPA:
${result.sheets.map((sheet, index) => `
Chapa ${index + 1}:
- Peças: ${sheet.pieces.length}
- Eficiência: ${sheet.efficiency.toFixed(2)}%
- Peso: ${sheet.weight.toFixed(2)} kg
- Peças: ${sheet.pieces.map(p => p.tag).join(', ')}
`).join('')}

APROVAÇÃO QA:
Operador: ${project.operador}
Turno: ${project.turno}
Data: ___/___/______
Assinatura: _________________
    `;

    return report;
  }
}

// Instância singleton do serviço
export const sheetOptimizationService = new SheetOptimizationService();
