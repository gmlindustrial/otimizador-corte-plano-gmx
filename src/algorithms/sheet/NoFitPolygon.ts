
import type { SheetCutPiece } from '@/types/sheet';

interface Point {
  x: number;
  y: number;
}

interface Polygon {
  points: Point[];
}

interface NFPResult {
  polygon: Polygon;
  area: number;
  boundingBox: { width: number; height: number; };
}

export class NoFitPolygonOptimizer {
  private sheetWidth: number;
  private sheetHeight: number;
  private kerf: number;

  constructor(sheetWidth: number, sheetHeight: number, kerf: number = 2) {
    this.sheetWidth = sheetWidth;
    this.sheetHeight = sheetHeight;
    this.kerf = kerf;
  }

  // Converter peça retangular para polígono
  pieceToPolygon(piece: SheetCutPiece): Polygon {
    return {
      points: [
        { x: 0, y: 0 },
        { x: piece.width, y: 0 },
        { x: piece.width, y: piece.height },
        { x: 0, y: piece.height }
      ]
    };
  }

  // Calcular No-Fit Polygon entre duas peças
  calculateNFP(fixedPiece: SheetCutPiece, movingPiece: SheetCutPiece): NFPResult {
    const fixedPoly = this.pieceToPolygon(fixedPiece);
    const movingPoly = this.pieceToPolygon(movingPiece);
    
    // Para retângulos, o NFP é calculado expandindo o retângulo fixo
    // pelas dimensões do retângulo móvel
    const expandedWidth = fixedPiece.width + movingPiece.width + this.kerf;
    const expandedHeight = fixedPiece.height + movingPiece.height + this.kerf;
    
    const nfpPolygon: Polygon = {
      points: [
        { x: -movingPiece.width - this.kerf/2, y: -movingPiece.height - this.kerf/2 },
        { x: fixedPiece.width + this.kerf/2, y: -movingPiece.height - this.kerf/2 },
        { x: fixedPiece.width + this.kerf/2, y: fixedPiece.height + this.kerf/2 },
        { x: -movingPiece.width - this.kerf/2, y: fixedPiece.height + this.kerf/2 }
      ]
    };

    return {
      polygon: nfpPolygon,
      area: expandedWidth * expandedHeight,
      boundingBox: { width: expandedWidth, height: expandedHeight }
    };
  }

  // Verificar se um ponto está dentro de um polígono (algoritmo ray casting)
  pointInPolygon(point: Point, polygon: Polygon): boolean {
    const x = point.x;
    const y = point.y;
    let inside = false;
    
    const points = polygon.points;
    let j = points.length - 1;
    
    for (let i = 0; i < points.length; i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
      j = i;
    }
    
    return inside;
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
          const nfp = this.calculateNFP(placedPiece.piece, newPiece);
          
          // Ajustar NFP para a posição da peça colocada
          const adjustedNFP: Polygon = {
            points: nfp.polygon.points.map(p => ({
              x: p.x + placedPiece.x,
              y: p.y + placedPiece.y
            }))
          };
          
          // Se a posição está dentro do NFP, há sobreposição
          if (this.pointInPolygon(position, adjustedNFP)) {
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

  // Calcular área de sobreposição entre dois retângulos
  calculateOverlapArea(
    rect1: { x: number; y: number; width: number; height: number; },
    rect2: { x: number; y: number; width: number; height: number; }
  ): number {
    const left = Math.max(rect1.x, rect2.x);
    const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const top = Math.max(rect1.y, rect2.y);
    const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
    
    if (left >= right || top >= bottom) {
      return 0; // Sem sobreposição
    }
    
    return (right - left) * (bottom - top);
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
          // Calcular score: preferir posições bottom-left
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
        
        if (this.calculateOverlapArea(rect1, rect2) > 0) {
          return false; // Há sobreposição
        }
      }
    }
    
    return true;
  }
}
