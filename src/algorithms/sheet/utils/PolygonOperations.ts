
import { Point, Polygon, GeometryUtils } from './GeometryUtils';

export class PolygonOperations {
  // Algoritmo de Graham Scan para casco convexo
  static calculateConvexHull(points: Point[]): Point[] {
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
             GeometryUtils.crossProduct(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
        hull.pop();
      }
      hull.push(point);
    }
    
    return hull;
  }

  // Verificar se um ponto está dentro de um polígono (algoritmo ray casting)
  static pointInPolygon(point: Point, polygon: Polygon): boolean {
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

  // Calcular NFP usando Minkowski Sum para geometrias complexas
  static calculateMinkowskiNFP(fixedPoly: Polygon, movingPoly: Polygon): Polygon {
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
    
    return { points: convexHull };
  }
}
