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
        return this.circleToPolygon(piece.geometry.radius || piece.width / 2);
      
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

  // Converter círculo em polígono aproximado
  private circleToPolygon(radius: number, segments: number = 16): Polygon {
    const points: Point[] = [];
    const angleStep = (2 * Math.PI) / segments;
    
    for (let i = 0; i < segments; i++) {
      const angle = i * angleStep;
      points.push({
        x: radius + radius * Math.cos(angle),
        y: radius + radius * Math.sin(angle)
      });
    }
    
    return { points };
  }

  // Calcular No-Fit Polygon entre duas peças (versão avançada)
  calculateAdvancedNFP(fixedPiece: SheetCutPiece, movingPiece: SheetCutPiece): NFPResult {
    const fixedPoly = this.pieceToPolygon(fixedPiece);
    const movingPoly = this.pieceToPolygon(movingPiece);
    
    // Para geometrias complexas, usar algoritmo Minkowski Sum
    if (fixedPiece.geometry?.type !== 'rectangle' || movingPiece.geometry?.type !== 'rectangle') {
      return this.calculateMinkowskiNFP(fixedPoly, movingPoly);
    }
    
    // Para retângulos, usar o método otimizado
    return this.calculateNFP(fixedPiece, movingPiece);
  }

  // Calcular NFP usando Minkowski Sum para geometrias complexas
  private calculateMinkowskiNFP(fixedPoly: Polygon, movingPoly: Polygon): NFPResult {
    const nfpPoints: Point[] = [];
    
    // Inverter o polígono móvel
    const invertedMoving = movingPoly.points.map(p => ({ x: -p.x, y: -p.y }));
    
    // Calcular Minkowski Sum
    for (const fixedPoint of fixedPoly.points) {
      for (const movingPoint of invertedMoving) {
        nfpPoints.push({
          x: fixedPoint.x + movingPoint.x,
          y: fixedPoint.y + movingPoint.y
        });
      }
    }
    
    // Calcular o casco convexo dos pontos NFP
    const convexHull = this.calculateConvexHull(nfpPoints);
    
    const boundingBox = this.calculateBoundingBox(convexHull);
    const area = this.calculatePolygonArea(convexHull);
    
    return {
      polygon: { points: convexHull },
      area,
      boundingBox
    };
  }

  // Algoritmo de Graham Scan para casco convexo
  private calculateConvexHull(points: Point[]): Point[] {
    if (points.length < 3) return points;
    
    // Encontrar o ponto mais baixo (e mais à esquerda em caso de empate)
    let start = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < points[start].y || 
          (points[i].y === points[start].y && points[i].x < points[start].x)) {
        start = i;
      }
    }
    
    // Ordenar pontos por ângulo polar
    const startPoint = points[start];
    const sortedPoints = points.filter((_, i) => i !== start)
      .sort((a, b) => {
        const angleA = Math.atan2(a.y - startPoint.y, a.x - startPoint.x);
        const angleB = Math.atan2(b.y - startPoint.y, b.x - startPoint.x);
        return angleA - angleB;
      });
    
    const hull = [startPoint];
    
    for (const point of sortedPoints) {
      while (hull.length > 1 && 
             this.crossProduct(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
        hull.pop();
      }
      hull.push(point);
    }
    
    return hull;
  }

  // Produto vetorial para determinar orientação
  private crossProduct(a: Point, b: Point, c: Point): number {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
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

  // Otimizar posicionamento com suporte a geometrias complexas
  optimizeWithAdvancedNFP(pieces: SheetCutPiece[]): Array<{ piece: SheetCutPiece; x: number; y: number; rotation: number; }> {
    const placedPieces: Array<{ piece: SheetCutPiece; x: number; y: number; rotation: number; }> = [];
    
    // Ordenar peças por complexidade e área
    const sortedPieces = [...pieces].sort((a, b) => {
      const complexityA = this.getComplexityScore(a);
      const complexityB = this.getComplexityScore(b);
      
      if (complexityA !== complexityB) {
        return complexityB - complexityA; // Mais complexas primeiro
      }
      
      const areaA = a.geometry?.area || (a.width * a.height);
      const areaB = b.geometry?.area || (b.width * b.height);
      return areaB - areaA; // Maiores primeiro
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
        // Para polígonos complexos, testar mais rotações
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

  // Calcular área de um polígono
  private calculatePolygonArea(points: Point[]): number {
    if (points.length < 3) return 0;
    
    let area = 0;
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    return Math.abs(area) / 2;
  }

  // Calcular área de um polígono
  private calculateBoundingBox(points: Point[]): { width: number; height: number } {
    if (points.length === 0) return { width: 0, height: 0 };
    
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    return {
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };
  }

  // Calcular área de um polígono
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

  // Calcular score de posição
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

  // Encontrar posições válidas para uma peça considerando NFPs de peças já colocadas
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

  // Verificar se uma posição é válida
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

  // Verificar se duas peças se sobrepondo
  private piecesOverlap(
    position: Point, 
    piece: SheetCutPiece, 
    placedPiece: { piece: SheetCutPiece; x: number; y: number; }
  ): boolean {
    // Verificação simples para retângulos
    const rect1 = {
      x: position.x - this.kerf / 2,
      y: position.y - this.kerf / 2,
      width: piece.width + this.kerf,
      height: piece.height + this.kerf
    };
    
    const rect2 = {
      x: placedPiece.x - this.kerf / 2,
      y: placedPiece.y - this.kerf / 2,
      width: placedPiece.piece.width + this.kerf,
      height: placedPiece.piece.height + this.kerf
    };
    
    return !(rect1.x + rect1.width <= rect2.x || 
             rect2.x + rect2.width <= rect1.x || 
             rect1.y + rect1.height <= rect2.y || 
             rect2.y + rect2.height <= rect1.y);
  }
}
