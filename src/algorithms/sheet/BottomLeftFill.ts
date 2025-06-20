
import type { SheetCutPiece, SheetPlacedPiece, SheetOptimizationResult } from '@/types/sheet';

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class BottomLeftFillOptimizer {
  private sheetWidth: number;
  private sheetHeight: number;
  private kerf: number;
  private placedPieces: SheetPlacedPiece[] = [];
  private colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  constructor(sheetWidth: number, sheetHeight: number, kerf: number = 2) {
    this.sheetWidth = sheetWidth;
    this.sheetHeight = sheetHeight;
    this.kerf = kerf;
  }

  optimize(pieces: SheetCutPiece[]): SheetOptimizationResult {
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

    // Ordenar por área decrescente
    expandedPieces.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    let currentSheetIndex = 0;

    for (const piece of expandedPieces) {
      let placed = false;

      // Tentar colocar na chapa atual
      if (sheets.length > 0) {
        const position = this.findBestPosition(piece, sheets[currentSheetIndex].pieces);
        if (position) {
          const placedPiece: SheetPlacedPiece = {
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            rotation: position.rotation,
            tag: piece.tag,
            color: this.colors[expandedPieces.indexOf(piece) % this.colors.length],
            originalPiece: piece
          };
          sheets[currentSheetIndex].pieces.push(placedPiece);
          placed = true;
        }
      }

      // Se não coube, criar nova chapa
      if (!placed) {
        this.placedPieces = [];
        const position = this.findBestPosition(piece, []);
        
        if (position) {
          const placedPiece: SheetPlacedPiece = {
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            rotation: position.rotation,
            tag: piece.tag,
            color: this.colors[expandedPieces.indexOf(piece) % this.colors.length],
            originalPiece: piece
          };

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

    // Calcular eficiências
    const sheetArea = this.sheetWidth * this.sheetHeight;
    let totalUtilizedArea = 0;
    let totalWeight = 0;

    sheets.forEach(sheet => {
      sheet.utilizedArea = sheet.pieces.reduce((sum, piece) => 
        sum + (piece.width * piece.height), 0
      );
      sheet.wasteArea = sheetArea - sheet.utilizedArea;
      sheet.efficiency = (sheet.utilizedArea / sheetArea) * 100;
      sheet.weight = this.calculateSheetWeight(sheet.utilizedArea);
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

  private findBestPosition(piece: SheetCutPiece, existingPieces: SheetPlacedPiece[]): 
    { x: number; y: number; width: number; height: number; rotation: number } | null {
    
    const orientations = piece.allowRotation ? 
      [{ w: piece.width, h: piece.height, rot: 0 }, { w: piece.height, h: piece.width, rot: 90 }] :
      [{ w: piece.width, h: piece.height, rot: 0 }];

    for (const orientation of orientations) {
      // Tentar posição bottom-left
      for (let y = 0; y <= this.sheetHeight - orientation.h; y += 10) {
        for (let x = 0; x <= this.sheetWidth - orientation.w; x += 10) {
          if (this.canPlacePiece(x, y, orientation.w, orientation.h, existingPieces)) {
            return {
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

    return null;
  }

  private canPlacePiece(x: number, y: number, width: number, height: number, existingPieces: SheetPlacedPiece[]): boolean {
    // Verificar limites da chapa
    if (x + width > this.sheetWidth || y + height > this.sheetHeight) {
      return false;
    }

    // Verificar sobreposição com peças existentes (considerando kerf)
    const newRect: Rectangle = { x: x - this.kerf, y: y - this.kerf, width: width + 2 * this.kerf, height: height + 2 * this.kerf };
    
    for (const piece of existingPieces) {
      const existingRect: Rectangle = { 
        x: piece.x - this.kerf, 
        y: piece.y - this.kerf, 
        width: piece.width + 2 * this.kerf, 
        height: piece.height + 2 * this.kerf 
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

  private calculateSheetWeight(utilizedArea: number): number {
    // A36: densidade 7.85 kg/dm³
    // Área em mm² -> dm² -> volume em dm³ -> peso em kg
    const areaDm2 = utilizedArea / 10000; // mm² para dm²
    const volumeDm3 = areaDm2 * (this.sheetHeight / 1000); // assumindo espessura em mm
    return volumeDm3 * 7.85; // kg
  }

  private calculateMaterialCost(totalWeight: number): number {
    // Custo aproximado do aço A36 por kg (valor exemplo)
    const costPerKg = 5.50; // R$ por kg
    return totalWeight * costPerKg;
  }
}
