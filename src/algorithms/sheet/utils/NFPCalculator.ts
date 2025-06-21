
import type { SheetCutPiece } from '@/types/sheet';
import { Point, Polygon, GeometryUtils } from './GeometryUtils';
import { PolygonOperations } from './PolygonOperations';

export interface NFPResult {
  polygon: Polygon;
  area: number;
  boundingBox: { width: number; height: number; };
}

export class NFPCalculator {
  private kerf: number;

  constructor(kerf: number = 2) {
    this.kerf = kerf;
  }

  // Converter peça para polígono baseado na geometria
  pieceToPolygon(piece: SheetCutPiece): Polygon {
    if (!piece.geometry || piece.geometry.type === 'rectangle') {
      return {
        points: [
          { x: 0, y: 0 },
          { x: piece.width, y: 0 },
          { x: piece.width, y: piece.height },
          { x: 0, y: piece.height }
        ]
      };
    }

    switch (piece.geometry.type) {
      case 'circle':
        return GeometryUtils.circleToPolygon(piece.geometry.radius || piece.width / 2);
      
      case 'polygon':
      case 'complex':
        return {
          points: piece.geometry.points || [
            { x: 0, y: 0 },
            { x: piece.width, y: 0 },
            { x: piece.width, y: piece.height },
            { x: 0, y: piece.height }
          ]
        };
      
      default:
        return {
          points: [
            { x: 0, y: 0 },
            { x: piece.width, y: 0 },
            { x: piece.width, y: piece.height },
            { x: 0, y: piece.height }
          ]
        };
    }
  }

  // Calcular No-Fit Polygon entre duas peças (versão avançada)
  calculateAdvancedNFP(fixedPiece: SheetCutPiece, movingPiece: SheetCutPiece): NFPResult {
    const fixedPoly = this.pieceToPolygon(fixedPiece);
    const movingPoly = this.pieceToPolygon(movingPiece);
    
    // Para geometrias complexas, usar algoritmo Minkowski Sum
    if (fixedPiece.geometry?.type !== 'rectangle' || movingPiece.geometry?.type !== 'rectangle') {
      const nfpPolygon = PolygonOperations.calculateMinkowskiNFP(fixedPoly, movingPoly);
      const boundingBox = GeometryUtils.calculateBoundingBox(nfpPolygon.points);
      const area = GeometryUtils.calculatePolygonArea(nfpPolygon.points);
      
      return {
        polygon: nfpPolygon,
        area,
        boundingBox
      };
    }
    
    // Para retângulos, usar o método otimizado
    return this.calculateNFP(fixedPiece, movingPiece);
  }

  // Calcular No-Fit Polygon entre duas peças
  calculateNFP(fixedPiece: SheetCutPiece, movingPiece: SheetCutPiece): NFPResult {
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
}
