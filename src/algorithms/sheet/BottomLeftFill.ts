
import type { SheetCutPiece, SheetPlacedPiece, SheetOptimizationResult } from '@/types/sheet';

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PlacePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export class BottomLeftFillOptimizer {
  private sheetWidth: number;
  private sheetHeight: number;
  private kerf: number;
  private thickness: number;
  private material: string;
  private colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  constructor(sheetWidth: number, sheetHeight: number, kerf: number = 2, thickness: number = 6, material: string = 'A36') {
    this.sheetWidth = sheetWidth;
    this.sheetHeight = sheetHeight;
    this.kerf = kerf;
    this.thickness = thickness;
    this.material = material;
  }

  optimize(pieces: SheetCutPiece[]): SheetOptimizationResult {
    // Validar se todas as peças cabem na chapa
    const invalidPieces = pieces.filter(piece => {
      const fitsNormal = piece.width <= this.sheetWidth && piece.height <= this.sheetHeight;
      const fitsRotated = piece.allowRotation && piece.height <= this.sheetWidth && piece.width <= this.sheetHeight;
      return !fitsNormal && !fitsRotated;
    });

    if (invalidPieces.length > 0) {
      console.warn('Peças muito grandes para a chapa:', invalidPieces);
    }

    const sheets: Array<{
      id: string;
      pieces: SheetPlacedPiece[];
      efficiency: number;
      wasteArea: number;
      utilizedArea: number;
      weight: number;
    }> = [];

    // Expandir peças considerando quantidade
    const expandedPieces: SheetCutPiece[] = [];
    pieces.forEach((piece, index) => {
      for (let i = 0; i < piece.quantity; i++) {
        expandedPieces.push({
          ...piece,
          id: `${piece.id}_${i}`,
          quantity: 1
        });
      }
    });

    // Ordenar por área decrescente para melhor aproveitamento
    expandedPieces.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    let currentSheetIndex = 0;

    for (const piece of expandedPieces) {
      let placed = false;

      // Tentar colocar na chapa atual
      if (sheets.length > 0) {
        const position = this.findBestBottomLeftPosition(piece, sheets[currentSheetIndex].pieces);
        if (position) {
          const placedPiece = this.createPlacedPiece(piece, position, expandedPieces.indexOf(piece));
          sheets[currentSheetIndex].pieces.push(placedPiece);
          placed = true;
        }
      }

      // Se não coube, criar nova chapa
      if (!placed) {
        const position = this.findBestBottomLeftPosition(piece, []);
        
        if (position) {
          const placedPiece = this.createPlacedPiece(piece, position, expandedPieces.indexOf(piece));

          sheets.push({
            id: `sheet-${sheets.length + 1}`,
            pieces: [placedPiece],
            efficiency: 0,
            wasteArea: 0,
            utilizedArea: 0,
            weight: 0
          });

          currentSheetIndex = sheets.length - 1;
        }
      }
    }

    // Calcular eficiências e métricas
    return this.calculateSheetMetrics(sheets);
  }

  private findBestBottomLeftPosition(piece: SheetCutPiece, existingPieces: SheetPlacedPiece[]): PlacePosition | null {
    const orientations = piece.allowRotation ? 
      [{ w: piece.width, h: piece.height, rot: 0 }, { w: piece.height, h: piece.width, rot: 90 }] :
      [{ w: piece.width, h: piece.height, rot: 0 }];

    let bestPosition: PlacePosition | null = null;
    let bestScore = Infinity;

    for (const orientation of orientations) {
      // Tentar todas as posições possíveis com incremento de 1mm para maior precisão
      for (let y = 0; y <= this.sheetHeight - orientation.h; y += 1) {
        for (let x = 0; x <= this.sheetWidth - orientation.w; x += 1) {
          if (this.canPlacePiece(x, y, orientation.w, orientation.h, existingPieces)) {
            // Calcular score bottom-left (menor y, depois menor x)
            const score = y * this.sheetWidth + x;
            
            if (score < bestScore) {
              bestScore = score;
              bestPosition = {
                x,
                y,
                width: orientation.w,
                height: orientation.h,
                rotation: orientation.rot
              };
            }
          }
        }
      }
    }

    return bestPosition;
  }

  private canPlacePiece(x: number, y: number, width: number, height: number, existingPieces: SheetPlacedPiece[]): boolean {
    // Verificar limites da chapa
    if (x + width > this.sheetWidth || y + height > this.sheetHeight) {
      return false;
    }

    // Verificar sobreposição com peças existentes (considerando kerf)
    const newRect: Rectangle = { 
      x: x - this.kerf/2, 
      y: y - this.kerf/2, 
      width: width + this.kerf, 
      height: height + this.kerf 
    };
    
    for (const piece of existingPieces) {
      const existingRect: Rectangle = { 
        x: piece.x - this.kerf/2, 
        y: piece.y - this.kerf/2, 
        width: piece.width + this.kerf, 
        height: piece.height + this.kerf 
      };
      
      if (this.rectanglesOverlap(newRect, existingRect)) {
        return false;
      }
    }

    return true;
  }

  private rectanglesOverlap(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(rect1.x + rect1.width <= rect2.x || 
             rect2.x + rect2.width <= rect1.x || 
             rect1.y + rect1.height <= rect2.y || 
             rect2.y + rect2.height <= rect1.y);
  }

  private createPlacedPiece(piece: SheetCutPiece, position: PlacePosition, colorIndex: number): SheetPlacedPiece {
    return {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      rotation: position.rotation,
      tag: piece.tag,
      color: this.colors[colorIndex % this.colors.length],
      originalPiece: piece
    };
  }

  private calculateSheetMetrics(sheets: Array<any>): SheetOptimizationResult {
    const sheetArea = this.sheetWidth * this.sheetHeight;
    let totalUtilizedArea = 0;
    let totalWeight = 0;

    sheets.forEach(sheet => {
      sheet.utilizedArea = sheet.pieces.reduce((sum: number, piece: SheetPlacedPiece) => 
        sum + (piece.width * piece.height), 0
      );
      sheet.wasteArea = sheetArea - sheet.utilizedArea;
      sheet.efficiency = (sheet.utilizedArea / sheetArea) * 100;
      sheet.weight = this.calculateSheetWeight(sheetArea); // Peso da chapa inteira
      totalUtilizedArea += sheet.utilizedArea;
      totalWeight += sheet.weight;
    });

    const totalWasteArea = (sheets.length * sheetArea) - totalUtilizedArea;
    const averageEfficiency = sheets.length > 0 ? 
      sheets.reduce((sum, sheet) => sum + sheet.efficiency, 0) / sheets.length : 0;

    return {
      sheets,
      totalSheets: sheets.length,
      totalWasteArea,
      averageEfficiency,
      totalWeight,
      materialCost: this.calculateMaterialCost(totalWeight)
    };
  }

  private calculateSheetWeight(sheetArea: number): number {
    // Calculate weight using the sheet area and project thickness.
    // Area (mm²) -> dm², then multiply by thickness in dm to get volume (dm³),
    // finally apply material density to obtain kg.
    const areaDm2 = sheetArea / 10000; // mm² para dm²
    const thicknessDm = this.thickness / 10; // mm para dm
    const volumeDm3 = areaDm2 * thicknessDm;
    
    // Densidade por material
    const densities: { [key: string]: number } = {
      'A36': 7.85,
      'A572': 7.85,
      'A514': 7.85
    };
    
    const density = densities[this.material] || 7.85;
    return volumeDm3 * density; // kg
  }

  private calculateMaterialCost(totalWeight: number): number {
    // Custo por material (valores exemplo - ajustar conforme mercado)
    const costPerKg: { [key: string]: number } = {
      'A36': 5.50,
      'A572': 6.20,
      'A514': 8.90
    };
    
    const cost = costPerKg[this.material] || 5.50;
    return totalWeight * cost;
  }
}
