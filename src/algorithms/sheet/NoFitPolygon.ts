
import type { SheetCutPiece } from '@/types/sheet';
import { Point, Polygon, GeometryUtils } from './utils/GeometryUtils';
import { PolygonOperations } from './utils/PolygonOperations';
import { NFPCalculator, NFPResult } from './utils/NFPCalculator';
import { SheetOptimizer } from './utils/SheetOptimizer';

export class NoFitPolygonOptimizer {
  private sheetWidth: number;
  private sheetHeight: number;
  private kerf: number;
  private nfpCalculator: NFPCalculator;
  private sheetOptimizer: SheetOptimizer;

  constructor(sheetWidth: number, sheetHeight: number, kerf: number = 2) {
    this.sheetWidth = sheetWidth;
    this.sheetHeight = sheetHeight;
    this.kerf = kerf;
    this.nfpCalculator = new NFPCalculator(kerf);
    this.sheetOptimizer = new SheetOptimizer(sheetWidth, sheetHeight, kerf);
  }

  // Delegate methods to maintain backward compatibility
  pieceToPolygon(piece: SheetCutPiece): Polygon {
    return this.nfpCalculator.pieceToPolygon(piece);
  }

  calculateAdvancedNFP(fixedPiece: SheetCutPiece, movingPiece: SheetCutPiece): NFPResult {
    return this.nfpCalculator.calculateAdvancedNFP(fixedPiece, movingPiece);
  }

  calculateNFP(fixedPiece: SheetCutPiece, movingPiece: SheetCutPiece): NFPResult {
    return this.nfpCalculator.calculateNFP(fixedPiece, movingPiece);
  }

  pointInPolygon(point: Point, polygon: Polygon): boolean {
    return PolygonOperations.pointInPolygon(point, polygon);
  }

  findValidPositions(
    newPiece: SheetCutPiece, 
    placedPieces: Array<{ piece: SheetCutPiece; x: number; y: number; }>
  ): Point[] {
    return this.sheetOptimizer.findValidPositions(newPiece, placedPieces);
  }

  calculateOverlapArea(
    rect1: { x: number; y: number; width: number; height: number; },
    rect2: { x: number; y: number; width: number; height: number; }
  ): number {
    return GeometryUtils.calculateOverlapArea(rect1, rect2);
  }

  optimizeWithNFP(pieces: SheetCutPiece[]): Array<{ piece: SheetCutPiece; x: number; y: number; rotation: number; }> {
    return this.sheetOptimizer.optimizeWithNFP(pieces);
  }

  optimizeWithAdvancedNFP(pieces: SheetCutPiece[]): Array<{ piece: SheetCutPiece; x: number; y: number; rotation: number; }> {
    const placedPieces: Array<{ piece: SheetCutPiece; x: number; y: number; rotation: number; }> = [];

    // CORRIGIDO: Expandir pecas por quantidade antes de otimizar
    const expandedPieces: SheetCutPiece[] = [];
    pieces.forEach(piece => {
      for (let i = 0; i < piece.quantity; i++) {
        expandedPieces.push({
          ...piece,
          id: `${piece.id}_${i}`,
          quantity: 1
        });
      }
    });

    // Ordenar peças por complexidade e área
    const sortedPieces = [...expandedPieces].sort((a, b) => {
      const complexityA = this.getComplexityScore(a);
      const complexityB = this.getComplexityScore(b);
      
      if (complexityA !== complexityB) {
        return complexityB - complexityA;
      }
      
      const areaA = a.geometry?.area || (a.width * a.height);
      const areaB = b.geometry?.area || (b.width * b.height);
      return areaB - areaA;
    });
    
    for (const piece of sortedPieces) {
      const orientations = this.getPossibleOrientations(piece);
      
      let bestPosition: { x: number; y: number; rotation: number; } | null = null;
      let bestScore = Infinity;
      
      for (const orientation of orientations) {
        const orientedPiece = this.applyOrientation(piece, orientation);
        const validPositions = this.findValidPositionsAdvanced(orientedPiece, placedPieces);
        
        for (const position of validPositions) {
          const score = this.calculatePositionScore(position, orientedPiece, placedPieces);
          
          if (score < bestScore) {
            bestScore = score;
            bestPosition = { ...position, rotation: orientation.rotation };
          }
        }
      }
      
      if (bestPosition) {
        const finalPiece = this.applyOrientation(piece, { rotation: bestPosition.rotation });
        placedPieces.push({
          piece: finalPiece,
          x: bestPosition.x,
          y: bestPosition.y,
          rotation: bestPosition.rotation
        });
      }
    }
    
    return placedPieces;
  }

  validateConfiguration(placedPieces: Array<{ piece: SheetCutPiece; x: number; y: number; }>): boolean {
    return this.sheetOptimizer.validateConfiguration(placedPieces);
  }

  // Private helper methods
  private getComplexityScore(piece: SheetCutPiece): number {
    if (!piece.geometry) return 1;
    
    switch (piece.geometry.type) {
      case 'rectangle': return 1;
      case 'circle': return 2;
      case 'polygon': return 3 + (piece.geometry.points?.length || 0) * 0.1;
      case 'complex': return 5;
      default: return 1;
    }
  }

  private getPossibleOrientations(piece: SheetCutPiece): Array<{ rotation: number }> {
    const orientations = [{ rotation: 0 }];
    
    if (piece.allowRotation) {
      if (piece.geometry?.type === 'rectangle' || !piece.geometry) {
        orientations.push({ rotation: 90 });
      } else if (piece.geometry.type === 'polygon' || piece.geometry.type === 'complex') {
        orientations.push({ rotation: 90 }, { rotation: 180 }, { rotation: 270 });
      }
    }
    
    return orientations;
  }

  private applyOrientation(piece: SheetCutPiece, orientation: { rotation: number }): SheetCutPiece {
    if (orientation.rotation === 0) return piece;
    
    const rotatedPiece = { ...piece };
    
    if (orientation.rotation === 90 && piece.geometry?.type === 'rectangle') {
      rotatedPiece.width = piece.height;
      rotatedPiece.height = piece.width;
    }
    
    return rotatedPiece;
  }

  private calculateWastedSpace(
    position: Point, 
    piece: SheetCutPiece, 
    placedPieces: Array<{ piece: SheetCutPiece; x: number; y: number; }>
  ): number {
    // Simplificação: calcular área de espaços pequenos criados
    let wastedArea = 0;
    
    // Esta é uma implementação simplificada
    // Em um sistema real, seria mais complexa
    
    return wastedArea;
  }

  private calculatePositionScore(
    position: Point, 
    piece: SheetCutPiece, 
    placedPieces: Array<{ piece: SheetCutPiece; x: number; y: number; }>
  ): number {
    // Score baseado em bottom-left preference
    let score = position.y * this.sheetWidth + position.x;
    
    // Penalizar posições que deixam espaços difíceis de preencher
    const wastedSpace = this.calculateWastedSpace(position, piece, placedPieces);
    score += wastedSpace * 1000;
    
    return score;
  }

  private findValidPositionsAdvanced(
    newPiece: SheetCutPiece, 
    placedPieces: Array<{ piece: SheetCutPiece; x: number; y: number; }>
  ): Point[] {
    const validPositions: Point[] = [];
    const step = Math.max(5, Math.min(newPiece.width, newPiece.height) / 10);
    
    for (let x = 0; x <= this.sheetWidth - newPiece.width; x += step) {
      for (let y = 0; y <= this.sheetHeight - newPiece.height; y += step) {
        const position = { x, y };
        
        if (this.isPositionValid(position, newPiece, placedPieces)) {
          validPositions.push(position);
        }
      }
    }
    
    return validPositions;
  }

  private isPositionValid(
    position: Point, 
    piece: SheetCutPiece, 
    placedPieces: Array<{ piece: SheetCutPiece; x: number; y: number; }>
  ): boolean {
    for (const placedPiece of placedPieces) {
      if (this.piecesOverlap(position, piece, placedPiece)) {
        return false;
      }
    }
    return true;
  }

  private piecesOverlap(
    position: Point,
    piece: SheetCutPiece,
    placedPiece: { piece: SheetCutPiece; x: number; y: number; }
  ): boolean {
    // CORRIGIDO: Verificar distancia minima (kerf) entre bordas das pecas
    // Nao subtrair kerf/2 das coordenadas para evitar coordenadas negativas

    // Verificar se ha sobreposicao considerando kerf como distancia minima
    const hasHorizontalOverlap = !(
      position.x >= placedPiece.x + placedPiece.piece.width + this.kerf || // Nova peca a direita
      position.x + piece.width + this.kerf <= placedPiece.x               // Nova peca a esquerda
    );

    const hasVerticalOverlap = !(
      position.y >= placedPiece.y + placedPiece.piece.height + this.kerf || // Nova peca abaixo
      position.y + piece.height + this.kerf <= placedPiece.y               // Nova peca acima
    );

    // Se ha sobreposicao em ambos os eixos, as pecas colidem
    return hasHorizontalOverlap && hasVerticalOverlap;
  }
}

// Export types for backward compatibility
export type { Point, Polygon, NFPResult };
