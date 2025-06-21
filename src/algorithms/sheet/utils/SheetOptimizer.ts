
import type { SheetCutPiece } from '@/types/sheet';
import { Point, GeometryUtils } from './GeometryUtils';
import { PolygonOperations } from './PolygonOperations';
import { NFPCalculator } from './NFPCalculator';

export class SheetOptimizer {
  private sheetWidth: number;
  private sheetHeight: number;
  private kerf: number;
  private nfpCalculator: NFPCalculator;

  constructor(sheetWidth: number, sheetHeight: number, kerf: number = 2) {
    this.sheetWidth = sheetWidth;
    this.sheetHeight = sheetHeight;
    this.kerf = kerf;
    this.nfpCalculator = new NFPCalculator(kerf);
  }

  // Encontrar posições válidas para uma peça considerando NFPs de peças já colocadas
  findValidPositions(
    newPiece: SheetCutPiece, 
    placedPieces: Array<{ piece: SheetCutPiece; x: number; y: number; }>
  ): Point[] {
    const validPositions: Point[] = [];
    const step = 5; // Incremento para busca de posições
    
    for (let x = 0; x <= this.sheetWidth - newPiece.width; x += step) {
      for (let y = 0; y <= this.sheetHeight - newPiece.height; y += step) {
        const position = { x, y };
        let isValid = true;
        
        // Verificar NFP com cada peça já colocada
        for (const placedPiece of placedPieces) {
          const nfp = this.nfpCalculator.calculateNFP(placedPiece.piece, newPiece);
          
          // Ajustar NFP para a posição da peça colocada
          const adjustedNFP = {
            points: nfp.polygon.points.map(p => ({
              x: p.x + placedPiece.x,
              y: p.y + placedPiece.y
            }))
          };
          
          // Se a posição está dentro do NFP, há sobreposição
          if (PolygonOperations.pointInPolygon(position, adjustedNFP)) {
            isValid = false;
            break;
          }
        }
        
        if (isValid) {
          validPositions.push(position);
        }
      }
    }
    
    return validPositions;
  }

  // Calcular score de complexidade da peça
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

  // Obter orientações possíveis da peça
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

  // Aplicar orientação à peça
  private applyOrientation(piece: SheetCutPiece, orientation: { rotation: number }): SheetCutPiece {
    if (orientation.rotation === 0) return piece;
    
    const rotatedPiece = { ...piece };
    
    if (orientation.rotation === 90 && piece.geometry?.type === 'rectangle') {
      rotatedPiece.width = piece.height;
      rotatedPiece.height = piece.width;
    }
    
    return rotatedPiece;
  }

  // Otimizar posicionamento usando NFP
  optimizeWithNFP(pieces: SheetCutPiece[]): Array<{ piece: SheetCutPiece; x: number; y: number; rotation: number; }> {
    const placedPieces: Array<{ piece: SheetCutPiece; x: number; y: number; rotation: number; }> = [];
    
    // Ordenar peças por área decrescente
    const sortedPieces = [...pieces].sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
    for (const piece of sortedPieces) {
      const orientations = piece.allowRotation ? 
        [{ w: piece.width, h: piece.height, rot: 0 }, { w: piece.height, h: piece.width, rot: 90 }] :
        [{ w: piece.width, h: piece.height, rot: 0 }];
      
      let bestPosition: { x: number; y: number; rotation: number; } | null = null;
      let bestScore = Infinity;
      
      for (const orientation of orientations) {
        const orientedPiece: SheetCutPiece = {
          ...piece,
          width: orientation.w,
          height: orientation.h
        };
        
        const validPositions = this.findValidPositions(orientedPiece, placedPieces);
        
        for (const position of validPositions) {
          const score = position.y * this.sheetWidth + position.x;
          
          if (score < bestScore) {
            bestScore = score;
            bestPosition = { ...position, rotation: orientation.rot };
          }
        }
      }
      
      if (bestPosition) {
        placedPieces.push({
          piece: {
            ...piece,
            width: piece.allowRotation && bestPosition.rotation === 90 ? piece.height : piece.width,
            height: piece.allowRotation && bestPosition.rotation === 90 ? piece.width : piece.height
          },
          x: bestPosition.x,
          y: bestPosition.y,
          rotation: bestPosition.rotation
        });
      }
    }
    
    return placedPieces;
  }

  // Validar se uma configuração é feasível
  validateConfiguration(placedPieces: Array<{ piece: SheetCutPiece; x: number; y: number; }>): boolean {
    for (let i = 0; i < placedPieces.length; i++) {
      for (let j = i + 1; j < placedPieces.length; j++) {
        const piece1 = placedPieces[i];
        const piece2 = placedPieces[j];
        
        const rect1 = {
          x: piece1.x - this.kerf/2,
          y: piece1.y - this.kerf/2,
          width: piece1.piece.width + this.kerf,
          height: piece1.piece.height + this.kerf
        };
        
        const rect2 = {
          x: piece2.x - this.kerf/2,
          y: piece2.y - this.kerf/2,
          width: piece2.piece.width + this.kerf,
          height: piece2.piece.height + this.kerf
        };
        
        if (GeometryUtils.calculateOverlapArea(rect1, rect2) > 0) {
          return false;
        }
      }
    }
    
    return true;
  }
}
