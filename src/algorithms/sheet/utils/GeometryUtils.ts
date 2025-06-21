
export interface Point {
  x: number;
  y: number;
}

export interface Polygon {
  points: Point[];
}

export class GeometryUtils {
  // Produto vetorial para determinar orientação
  static crossProduct(a: Point, b: Point, c: Point): number {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  // Calcular área de um polígono
  static calculatePolygonArea(points: Point[]): number {
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

  // Calcular bounding box
  static calculateBoundingBox(points: Point[]): { width: number; height: number } {
    if (points.length === 0) return { width: 0, height: 0 };
    
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    return {
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };
  }

  // Calcular área de sobreposição entre dois retângulos
  static calculateOverlapArea(
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

  // Converter círculo em polígono aproximado
  static circleToPolygon(radius: number, segments: number = 16): Polygon {
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
}
