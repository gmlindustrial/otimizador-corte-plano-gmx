/**
 * DxfParserService — Lê arquivos DXF e converte para SheetCutPiece[]
 *
 * Suporta entidades: LINE, ARC, CIRCLE, LWPOLYLINE, POLYLINE, ELLIPSE
 * Detecta furos (círculos internos ao contorno)
 * Calcula bounding box, área e perímetro
 */

import DxfParser from 'dxf-parser';
import type { SheetCutPiece } from '@/types/sheet';

interface DxfPoint {
  x: number;
  y: number;
}

interface ParsedPiece {
  /** Pontos do contorno externo */
  contour: DxfPoint[];
  /** Furos detectados (círculos internos) */
  holes: Array<{ center: DxfPoint; radius: number }>;
  /** Bounding box */
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  /** Área estimada em mm² */
  area: number;
  /** Perímetro estimado em mm */
  perimeter: number;
  /** Nome do layer de origem */
  layer: string;
}

export class DxfParserService {
  private parser: DxfParser;

  constructor() {
    this.parser = new DxfParser();
  }

  /**
   * Parse de arquivo DXF (texto) e retorna peças encontradas
   */
  parseFile(dxfContent: string): ParsedPiece[] {
    const dxf = this.parser.parseSync(dxfContent);
    if (!dxf || !dxf.entities || dxf.entities.length === 0) {
      throw new Error('Arquivo DXF vazio ou inválido — nenhuma entidade encontrada');
    }

    console.log(`🔄 DXF Parser: ${dxf.entities.length} entidades encontradas`);

    // Filtrar entidades não-geométricas (textos, cotas, dimensões)
    const NON_GEOMETRY_TYPES = new Set([
      'TEXT', 'MTEXT', 'DIMENSION', 'LEADER', 'ATTDEF', 'ATTRIB',
      'POINT', 'INSERT', 'HATCH', 'VIEWPORT',
    ]);

    // Layers que tipicamente contêm elementos auxiliares (cota, centro, hatch)
    const AUXILIARY_LAYER_PATTERNS = [
      /defpoints/i,    // Layer padrão de cotas no AutoCAD
      /dim/i,          // Dimensionamento
      /cot[ae]/i,      // Cota (PT)
      /centro/i,       // Linhas de centro
      /center/i,       // Linhas de centro (EN)
      /hidden/i,       // Linhas ocultas
      /hatch/i,        // Hachuras
      /text/i,         // Textos
      /anno/i,         // Anotações
      /viewport/i,     // Viewports
    ];

    const geometricEntities = dxf.entities.filter((entity: any) => {
      // Ignorar tipos não-geométricos
      if (NON_GEOMETRY_TYPES.has(entity.type)) return false;
      // Ignorar entidades invisíveis
      if (entity.visible === false) return false;
      return true;
    });

    console.log(`🔧 Entidades geométricas: ${geometricEntities.length} de ${dxf.entities.length}`);

    // Agrupar entidades por layer
    const layers = new Map<string, any[]>();
    for (const entity of geometricEntities) {
      const layer = entity.layer || '0';
      if (!layers.has(layer)) {
        layers.set(layer, []);
      }
      layers.get(layer)!.push(entity);
    }

    console.log(`📂 Layers encontrados: ${Array.from(layers.keys()).join(', ')}`);

    // Identificar layers auxiliares
    const auxiliaryLayers = new Set<string>();
    for (const layerName of layers.keys()) {
      if (AUXILIARY_LAYER_PATTERNS.some(pattern => pattern.test(layerName))) {
        auxiliaryLayers.add(layerName);
        console.log(`⏭️ Layer auxiliar ignorado: "${layerName}"`);
      }
    }

    // Verificar via linetype: linhas de centro (CENTER, DASHDOT) são auxiliares
    for (const [layerName, entities] of layers) {
      if (auxiliaryLayers.has(layerName)) continue;
      const centerLineTypes = entities.filter((e: any) =>
        e.lineType && /center|dashdot|phantom/i.test(e.lineType)
      );
      // Se >80% das entidades do layer são linhas de centro, é layer auxiliar
      if (centerLineTypes.length > entities.length * 0.8 && entities.length > 0) {
        auxiliaryLayers.add(layerName);
        console.log(`⏭️ Layer de linhas de centro ignorado: "${layerName}" (${centerLineTypes.length}/${entities.length} entidades CENTER)`);
      }
    }

    const pieces: ParsedPiece[] = [];

    // Processar cada layer (exceto auxiliares)
    for (const [layerName, entities] of layers) {
      // Ignorar layers auxiliares
      if (auxiliaryLayers.has(layerName)) continue;
      const contourPoints: DxfPoint[] = [];
      const holes: Array<{ center: DxfPoint; radius: number }> = [];

      for (const entity of entities) {
        switch (entity.type) {
          case 'LINE':
            this.processLine(entity, contourPoints);
            break;
          case 'LWPOLYLINE':
          case 'POLYLINE':
            this.processPolyline(entity, contourPoints);
            break;
          case 'ARC':
            this.processArc(entity, contourPoints);
            break;
          case 'CIRCLE':
            // Círculos pequenos = furos; grandes = contorno
            if (contourPoints.length > 0) {
              holes.push({ center: { x: entity.center.x, y: entity.center.y }, radius: entity.radius });
            } else {
              this.processCircle(entity, contourPoints);
            }
            break;
          case 'ELLIPSE':
            this.processEllipse(entity, contourPoints);
            break;
        }
      }

      // Se temos pontos, verificar círculos: se o contorno principal é um polígono,
      // os círculos menores que estão dentro dele são furos
      if (contourPoints.length >= 3) {
        const bb = this.calculateBoundingBox(contourPoints);

        // Reclassificar círculos: se center está dentro do bounding box = furo
        const circleEntities = entities.filter((e: any) => e.type === 'CIRCLE');
        const reclassifiedHoles: Array<{ center: DxfPoint; radius: number }> = [];

        for (const circle of circleEntities) {
          const cx = circle.center.x;
          const cy = circle.center.y;
          if (cx >= bb.minX && cx <= bb.maxX && cy >= bb.minY && cy <= bb.maxY) {
            reclassifiedHoles.push({
              center: { x: cx, y: cy },
              radius: circle.radius,
            });
          }
        }

        const area = this.calculatePolygonArea(contourPoints);
        const perimeter = this.calculatePerimeter(contourPoints);

        pieces.push({
          contour: contourPoints,
          holes: reclassifiedHoles.length > 0 ? reclassifiedHoles : holes,
          boundingBox: bb,
          area: Math.abs(area),
          perimeter,
          layer: layerName,
        });
      }
    }

    // Filtrar peças muito finas (provavelmente linhas de cota ou anotações)
    // Se uma dimensão é < 30% da outra, não é peça real
    const validPieces = pieces.filter(piece => {
      const { width, height } = piece.boundingBox;
      if (width < 1 || height < 1) {
        console.log(`⏭️ Peça descartada (dimensão zero): layer "${piece.layer}" (${width.toFixed(1)}×${height.toFixed(1)}mm)`);
        return false;
      }
      const ratio = Math.min(width, height) / Math.max(width, height);
      if (ratio < 0.30) {
        console.log(`⏭️ Peça descartada (muito fina, provavelmente cota): layer "${piece.layer}" (${width.toFixed(1)}×${height.toFixed(1)}mm, ratio=${ratio.toFixed(2)})`);
        return false;
      }
      // Peças com poucos pontos (< 3 pontos únicos) são linhas soltas
      const uniquePoints = this.removeDuplicatePoints(piece.contour, 1);
      if (uniquePoints.length < 3) {
        console.log(`⏭️ Peça descartada (< 3 pontos): layer "${piece.layer}"`);
        return false;
      }
      return true;
    });
    pieces.length = 0;
    pieces.push(...validPieces);

    // Deduplicar peças com bounding box muito similar (tolerância 5%)
    const deduplicatedPieces: ParsedPiece[] = [];
    for (const piece of pieces) {
      const isDuplicate = deduplicatedPieces.some(existing => {
        const wRatio = Math.abs(existing.boundingBox.width - piece.boundingBox.width) / Math.max(existing.boundingBox.width, 1);
        const hRatio = Math.abs(existing.boundingBox.height - piece.boundingBox.height) / Math.max(existing.boundingBox.height, 1);
        return wRatio < 0.05 && hRatio < 0.05;
      });
      if (!isDuplicate) {
        deduplicatedPieces.push(piece);
      } else {
        console.log(`⏭️ Peça duplicada ignorada: layer "${piece.layer}" (${piece.boundingBox.width.toFixed(0)}×${piece.boundingBox.height.toFixed(0)}mm)`);
      }
    }
    pieces.length = 0;
    pieces.push(...deduplicatedPieces);

    // Se nenhuma peça por layer, tentar processar todas as entidades como uma única peça
    if (pieces.length === 0) {
      const allPoints = this.processAllEntities(dxf.entities);
      if (allPoints.length >= 3) {
        const bb = this.calculateBoundingBox(allPoints);
        const allCircles = dxf.entities
          .filter((e: any) => e.type === 'CIRCLE')
          .map((e: any) => ({ center: { x: e.center.x, y: e.center.y }, radius: e.radius }));

        pieces.push({
          contour: allPoints,
          holes: allCircles,
          boundingBox: bb,
          area: Math.abs(this.calculatePolygonArea(allPoints)),
          perimeter: this.calculatePerimeter(allPoints),
          layer: '0',
        });
      }
    }

    if (pieces.length === 0) {
      throw new Error('Nenhuma peça válida encontrada no arquivo DXF');
    }

    console.log(`✅ ${pieces.length} peça(s) extraída(s) do DXF`);
    return pieces;
  }

  /**
   * Converte peças parsed para SheetCutPiece[] prontas para otimização
   */
  toSheetCutPieces(
    parsedPieces: ParsedPiece[],
    options: {
      quantity?: number;
      allowRotation?: boolean;
      thickness?: number;
      material?: string;
      fileName?: string;
    } = {}
  ): SheetCutPiece[] {
    return parsedPieces.map((piece, index) => {
      const isComplex = piece.contour.length > 4 || piece.holes.length > 0;

      return {
        id: `dxf-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        width: Math.round(piece.boundingBox.width * 100) / 100,
        height: Math.round(piece.boundingBox.height * 100) / 100,
        quantity: options.quantity ?? 1,
        tag: `DXF-${piece.layer}-${index + 1}`,
        allowRotation: options.allowRotation ?? true,
        thickness: options.thickness,
        geometry: {
          type: isComplex ? 'complex' : (piece.contour.length === 4 ? 'rectangle' : 'polygon'),
          points: piece.contour.map(p => ({
            x: Math.round((p.x - piece.boundingBox.minX) * 100) / 100,
            y: Math.round((p.y - piece.boundingBox.minY) * 100) / 100,
          })),
          boundingBox: {
            width: Math.round(piece.boundingBox.width * 100) / 100,
            height: Math.round(piece.boundingBox.height * 100) / 100,
          },
          area: Math.round(piece.area * 100) / 100,
          perimeter: Math.round(piece.perimeter * 100) / 100,
        },
        material: options.material,
        cadFile: options.fileName,
      };
    });
  }

  // === Processadores de entidades ===

  private processLine(entity: any, points: DxfPoint[]) {
    if (entity.vertices && entity.vertices.length >= 2) {
      points.push({ x: entity.vertices[0].x, y: entity.vertices[0].y });
      points.push({ x: entity.vertices[1].x, y: entity.vertices[1].y });
    }
  }

  private processPolyline(entity: any, points: DxfPoint[]) {
    if (entity.vertices) {
      for (const vertex of entity.vertices) {
        points.push({ x: vertex.x, y: vertex.y });
      }
      // Fechar polígono se shape = true
      if (entity.shape && entity.vertices.length > 0) {
        const first = entity.vertices[0];
        const last = entity.vertices[entity.vertices.length - 1];
        if (Math.abs(first.x - last.x) > 0.01 || Math.abs(first.y - last.y) > 0.01) {
          points.push({ x: first.x, y: first.y });
        }
      }
    }
  }

  private processArc(entity: any, points: DxfPoint[]) {
    // Aproximar arco como polilinha com 16 segmentos
    const segments = 16;
    const startAngle = (entity.startAngle || 0) * Math.PI / 180;
    const endAngle = (entity.endAngle || 360) * Math.PI / 180;
    let angleRange = endAngle - startAngle;
    if (angleRange <= 0) angleRange += 2 * Math.PI;

    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (angleRange * i) / segments;
      points.push({
        x: entity.center.x + entity.radius * Math.cos(angle),
        y: entity.center.y + entity.radius * Math.sin(angle),
      });
    }
  }

  private processCircle(entity: any, points: DxfPoint[]) {
    // Aproximar círculo como polígono de 32 lados
    const segments = 32;
    for (let i = 0; i < segments; i++) {
      const angle = (2 * Math.PI * i) / segments;
      points.push({
        x: entity.center.x + entity.radius * Math.cos(angle),
        y: entity.center.y + entity.radius * Math.sin(angle),
      });
    }
  }

  private processEllipse(entity: any, points: DxfPoint[]) {
    // Aproximar elipse como polígono de 32 lados
    const segments = 32;
    const majorX = entity.majorAxisEndPoint?.x || entity.radius || 100;
    const majorY = entity.majorAxisEndPoint?.y || 0;
    const majorLength = Math.sqrt(majorX * majorX + majorY * majorY);
    const minorLength = majorLength * (entity.axisRatio || 0.5);
    const rotation = Math.atan2(majorY, majorX);

    for (let i = 0; i < segments; i++) {
      const angle = (2 * Math.PI * i) / segments;
      const x = majorLength * Math.cos(angle);
      const y = minorLength * Math.sin(angle);
      // Rotacionar
      points.push({
        x: entity.center.x + x * Math.cos(rotation) - y * Math.sin(rotation),
        y: entity.center.y + x * Math.sin(rotation) + y * Math.cos(rotation),
      });
    }
  }

  private processAllEntities(entities: any[]): DxfPoint[] {
    const points: DxfPoint[] = [];
    for (const entity of entities) {
      switch (entity.type) {
        case 'LINE': this.processLine(entity, points); break;
        case 'LWPOLYLINE':
        case 'POLYLINE': this.processPolyline(entity, points); break;
        case 'ARC': this.processArc(entity, points); break;
        case 'ELLIPSE': this.processEllipse(entity, points); break;
      }
    }
    return this.removeDuplicatePoints(points);
  }

  private removeDuplicatePoints(points: DxfPoint[], tolerance = 0.1): DxfPoint[] {
    const unique: DxfPoint[] = [];
    for (const p of points) {
      const exists = unique.some(u =>
        Math.abs(u.x - p.x) < tolerance && Math.abs(u.y - p.y) < tolerance
      );
      if (!exists) unique.push(p);
    }
    return unique;
  }

  // === Cálculos geométricos ===

  private calculateBoundingBox(points: DxfPoint[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private calculatePolygonArea(points: DxfPoint[]): number {
    // Shoelace formula
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return area / 2;
  }

  private calculatePerimeter(points: DxfPoint[]): number {
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const dx = points[j].x - points[i].x;
      const dy = points[j].y - points[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    return perimeter;
  }
}
