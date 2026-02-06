import type { SheetCutPiece, SheetPlacedPiece, SheetOptimizationResult } from '@/types/sheet';

interface FreeRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PlacementResult {
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
}

export class MaxRectsPackerOptimizer {
  private sheetWidth: number;
  private sheetHeight: number;
  private kerf: number;
  private thickness: number;
  private material: string;
  private colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  constructor(
    sheetWidth: number,
    sheetHeight: number,
    kerf: number = 2,
    thickness: number = 6,
    material: string = 'A36'
  ) {
    this.sheetWidth = sheetWidth;
    this.sheetHeight = sheetHeight;
    this.kerf = kerf;
    this.thickness = thickness;
    this.material = material;
  }

  optimize(pieces: SheetCutPiece[]): SheetOptimizationResult {
    console.log('MaxRectsPackerOptimizer: Iniciando otimização...');
    console.log(`Chapa: ${this.sheetWidth}x${this.sheetHeight}mm, Kerf: ${this.kerf}mm`);
    console.log(`Peças para otimizar: ${pieces.length}`);

    // Expandir peças por quantidade
    const expandedPieces: { piece: SheetCutPiece; index: number }[] = [];
    pieces.forEach((piece, idx) => {
      for (let i = 0; i < piece.quantity; i++) {
        expandedPieces.push({ piece, index: idx });
      }
    });

    // Ordenar por área decrescente (maior primeiro = melhor aproveitamento)
    expandedPieces.sort((a, b) => {
      const areaA = a.piece.width * a.piece.height;
      const areaB = b.piece.width * b.piece.height;
      return areaB - areaA;
    });

    console.log(`Total de retângulos para empacotar: ${expandedPieces.length}`);

    const sheets: {
      id: string;
      pieces: SheetPlacedPiece[];
      freeRects: FreeRectangle[];
    }[] = [];

    let colorIndex = 0;

    // Para cada peça, tentar colocar em uma chapa existente ou criar nova
    for (const { piece, index } of expandedPieces) {
      let placed = false;

      // Tentar colocar em uma chapa existente
      for (const sheet of sheets) {
        const placement = this.findBestPosition(
          piece.width + this.kerf,
          piece.height + this.kerf,
          sheet.freeRects,
          piece.allowRotation !== false
        );

        if (placement) {
          // Colocar a peça (sem o kerf na dimensão visual)
          sheet.pieces.push({
            x: placement.x,
            y: placement.y,
            width: placement.rotated ? piece.height : piece.width,
            height: placement.rotated ? piece.width : piece.height,
            rotation: placement.rotated ? 90 : 0,
            tag: piece.tag,
            color: this.colors[(colorIndex++) % this.colors.length],
            originalPiece: piece
          });

          // Atualizar retângulos livres
          this.splitFreeRectangles(sheet.freeRects, {
            x: placement.x,
            y: placement.y,
            width: placement.width,
            height: placement.height
          });

          placed = true;
          break;
        }
      }

      // Se não coube em nenhuma chapa existente, criar nova
      if (!placed) {
        const newSheet = {
          id: `sheet-${sheets.length + 1}`,
          pieces: [] as SheetPlacedPiece[],
          freeRects: [{ x: 0, y: 0, width: this.sheetWidth, height: this.sheetHeight }]
        };

        const placement = this.findBestPosition(
          piece.width + this.kerf,
          piece.height + this.kerf,
          newSheet.freeRects,
          piece.allowRotation !== false
        );

        if (placement) {
          newSheet.pieces.push({
            x: placement.x,
            y: placement.y,
            width: placement.rotated ? piece.height : piece.width,
            height: placement.rotated ? piece.width : piece.height,
            rotation: placement.rotated ? 90 : 0,
            tag: piece.tag,
            color: this.colors[(colorIndex++) % this.colors.length],
            originalPiece: piece
          });

          this.splitFreeRectangles(newSheet.freeRects, {
            x: placement.x,
            y: placement.y,
            width: placement.width,
            height: placement.height
          });

          sheets.push(newSheet);
        } else {
          console.warn(`Peça ${piece.tag} (${piece.width}x${piece.height}) não cabe na chapa!`);
        }
      }
    }

    console.log(`Chapas criadas: ${sheets.length}`);

    // Converter para formato de resultado
    const sheetArea = this.sheetWidth * this.sheetHeight;
    const resultSheets = sheets.map((sheet, idx) => {
      const utilizedArea = sheet.pieces.reduce((sum, p) => sum + p.width * p.height, 0);
      const wasteArea = sheetArea - utilizedArea;
      const efficiency = (utilizedArea / sheetArea) * 100;

      console.log(`Chapa ${idx + 1}: ${sheet.pieces.length} peças, Eficiência ${efficiency.toFixed(1)}%`);

      return {
        id: sheet.id,
        pieces: sheet.pieces,
        efficiency,
        wasteArea,
        utilizedArea,
        weight: this.calculateSheetWeight(sheetArea)
      };
    });

    const totalSheets = resultSheets.length;
    const totalUtilizedArea = resultSheets.reduce((sum, s) => sum + s.utilizedArea, 0);
    const totalWasteArea = (totalSheets * sheetArea) - totalUtilizedArea;
    const averageEfficiency = totalSheets > 0
      ? resultSheets.reduce((sum, s) => sum + s.efficiency, 0) / totalSheets
      : 0;
    const totalWeight = resultSheets.reduce((sum, s) => sum + s.weight, 0);

    console.log(`Otimização concluída: ${totalSheets} chapas, Eficiência média: ${averageEfficiency.toFixed(1)}%`);

    return {
      sheets: resultSheets,
      totalSheets,
      totalWasteArea,
      averageEfficiency,
      totalWeight,
      materialCost: this.calculateMaterialCost(totalWeight)
    };
  }

  // Algoritmo MAXRECTS-BL (Bottom-Left)
  // Prioriza posições mais embaixo (menor Y), depois mais à esquerda (menor X)
  private findBestPosition(
    width: number,
    height: number,
    freeRects: FreeRectangle[],
    allowRotation: boolean
  ): PlacementResult | null {
    let bestScore = Infinity;
    let bestRect: FreeRectangle | null = null;
    let bestRotated = false;
    let bestWidth = width;
    let bestHeight = height;

    // CORRIGIDO: Usar sheetWidth + 1 como multiplicador para evitar overflow
    // Garante que Y tem prioridade sobre X sem usar numero magico 100000
    const yMultiplier = this.sheetWidth + 1;

    for (const rect of freeRects) {
      // Tentar sem rotação
      if (width <= rect.width && height <= rect.height) {
        // Bottom-Left: menor Y primeiro, depois menor X
        const bottomLeftScore = rect.y * yMultiplier + rect.x;

        if (bottomLeftScore < bestScore) {
          bestScore = bottomLeftScore;
          bestRect = rect;
          bestRotated = false;
          bestWidth = width;
          bestHeight = height;
        }
      }

      // Tentar com rotação
      if (allowRotation && height <= rect.width && width <= rect.height) {
        const bottomLeftScore = rect.y * yMultiplier + rect.x;

        if (bottomLeftScore < bestScore) {
          bestScore = bottomLeftScore;
          bestRect = rect;
          bestRotated = true;
          bestWidth = height;
          bestHeight = width;
        }
      }
    }

    if (bestRect) {
      return {
        x: bestRect.x,
        y: bestRect.y,
        width: bestWidth,
        height: bestHeight,
        rotated: bestRotated
      };
    }

    return null;
  }

  // Dividir retângulos livres após colocar uma peça
  private splitFreeRectangles(freeRects: FreeRectangle[], usedRect: { x: number; y: number; width: number; height: number }): void {
    const newRects: FreeRectangle[] = [];

    for (let i = freeRects.length - 1; i >= 0; i--) {
      const freeRect = freeRects[i];

      // Se não há sobreposição, manter o retângulo
      if (!this.rectanglesOverlap(freeRect, usedRect)) {
        continue;
      }

      // Remover o retângulo que será dividido
      freeRects.splice(i, 1);

      // Criar novos retângulos a partir das áreas livres

      // Área à esquerda
      if (usedRect.x > freeRect.x) {
        newRects.push({
          x: freeRect.x,
          y: freeRect.y,
          width: usedRect.x - freeRect.x,
          height: freeRect.height
        });
      }

      // Área à direita
      if (usedRect.x + usedRect.width < freeRect.x + freeRect.width) {
        newRects.push({
          x: usedRect.x + usedRect.width,
          y: freeRect.y,
          width: (freeRect.x + freeRect.width) - (usedRect.x + usedRect.width),
          height: freeRect.height
        });
      }

      // Área abaixo
      if (usedRect.y > freeRect.y) {
        newRects.push({
          x: freeRect.x,
          y: freeRect.y,
          width: freeRect.width,
          height: usedRect.y - freeRect.y
        });
      }

      // Área acima
      if (usedRect.y + usedRect.height < freeRect.y + freeRect.height) {
        newRects.push({
          x: freeRect.x,
          y: usedRect.y + usedRect.height,
          width: freeRect.width,
          height: (freeRect.y + freeRect.height) - (usedRect.y + usedRect.height)
        });
      }
    }

    // Adicionar novos retângulos
    freeRects.push(...newRects);

    // Remover retângulos contidos em outros (otimização)
    this.pruneFreeRectangles(freeRects);
  }

  private rectanglesOverlap(a: FreeRectangle, b: { x: number; y: number; width: number; height: number }): boolean {
    return !(a.x >= b.x + b.width ||
             a.x + a.width <= b.x ||
             a.y >= b.y + b.height ||
             a.y + a.height <= b.y);
  }

  // Remover retângulos que estão completamente contidos em outros
  private pruneFreeRectangles(freeRects: FreeRectangle[]): void {
    for (let i = freeRects.length - 1; i >= 0; i--) {
      for (let j = freeRects.length - 1; j >= 0; j--) {
        if (i !== j && this.isContainedIn(freeRects[i], freeRects[j])) {
          freeRects.splice(i, 1);
          break;
        }
      }
    }
  }

  private isContainedIn(a: FreeRectangle, b: FreeRectangle): boolean {
    return a.x >= b.x &&
           a.y >= b.y &&
           a.x + a.width <= b.x + b.width &&
           a.y + a.height <= b.y + b.height;
  }

  private calculateSheetWeight(sheetArea: number): number {
    const areaDm2 = sheetArea / 10000;
    const thicknessDm = this.thickness / 10;
    const volumeDm3 = areaDm2 * thicknessDm;
    const densities: { [key: string]: number } = { 'A36': 7.85, 'A572': 7.85, 'A514': 7.85 };
    return volumeDm3 * (densities[this.material] || 7.85);
  }

  private calculateMaterialCost(totalWeight: number): number {
    const costPerKg: { [key: string]: number } = { 'A36': 5.50, 'A572': 6.20, 'A514': 8.90 };
    return totalWeight * (costPerKg[this.material] || 5.50);
  }
}
