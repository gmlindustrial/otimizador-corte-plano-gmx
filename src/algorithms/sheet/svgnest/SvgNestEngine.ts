/**
 * SvgNestEngine — Wrapper TypeScript para o algoritmo SVGnest
 * Usa NFP (No-Fit Polygon) + Genetic Algorithm para nesting de geometrias irregulares.
 *
 * O core do SVGnest (geometryutil.js + placementworker.js) será carregado
 * dinamicamente. Este wrapper converte entre nosso formato (SheetCutPiece)
 * e o formato do SVGnest (polygon arrays).
 *
 * Referência: https://github.com/Jack000/SVGnest
 * Licença: MIT
 *
 * NOTA: Esta é a estrutura do wrapper. Os arquivos JS do SVGnest core
 * (geometryutil.js, placementworker.js) precisam ser adicionados ao projeto.
 * O clipper.js é instalado via npm (js-clipper).
 */

import type {
  SheetCutPiece,
  SheetPlacedPiece,
  SheetOptimizationResult,
} from '@/types/sheet';

export interface NestPolygon {
  id: string;
  points: Array<{ x: number; y: number }>;
  children?: NestPolygon[]; // holes
  rotation?: number;
  source?: number;
}

export interface NestConfig {
  spacing: number;       // kerf em mm
  rotations: number;     // número de rotações a testar (4 = 0/90/180/270)
  populationSize: number; // tamanho da população genética
  mutationRate: number;   // taxa de mutação (0-1)
  generations: number;    // gerações máximas
}

export interface NestPlacement {
  x: number;
  y: number;
  id: string;
  rotation: number;
  sheetIndex: number;
}

export interface NestResult {
  placements: NestPlacement[];
  sheets: Array<{
    index: number;
    utilization: number;
    pieces: NestPlacement[];
  }>;
  fitness: number;
  unplaced: string[];
}

const DEFAULT_CONFIG: NestConfig = {
  spacing: 2,
  rotations: 4,
  populationSize: 10,
  mutationRate: 10,
  generations: 30,
};

/**
 * Converte SheetCutPiece para polígono do SVGnest
 */
export function pieceToNestPolygon(piece: SheetCutPiece, index: number): NestPolygon {
  let points: Array<{ x: number; y: number }>;

  if (piece.geometry?.points && piece.geometry.points.length >= 3) {
    // Geometria complexa do DXF
    points = piece.geometry.points.map(p => ({ x: p.x, y: p.y }));
  } else {
    // Retângulo padrão
    points = [
      { x: 0, y: 0 },
      { x: piece.width, y: 0 },
      { x: piece.width, y: piece.height },
      { x: 0, y: piece.height },
    ];
  }

  return {
    id: piece.id || `piece-${index}`,
    points,
    rotation: 0,
    source: index,
  };
}

/**
 * Converte NestPlacement[] para SheetOptimizationResult
 */
export function nestResultToSheetResult(
  nestResult: NestResult,
  originalPieces: SheetCutPiece[],
  sheetWidth: number,
  sheetHeight: number,
  thickness: number = 6,
  material: string = 'A36',
): SheetOptimizationResult {
  const sheetArea = sheetWidth * sheetHeight;
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  // Agrupar placements por sheet
  const sheetMap = new Map<number, NestPlacement[]>();
  for (const p of nestResult.placements) {
    if (!sheetMap.has(p.sheetIndex)) sheetMap.set(p.sheetIndex, []);
    sheetMap.get(p.sheetIndex)!.push(p);
  }

  const sheets = Array.from(sheetMap.entries()).map(([sheetIdx, placements]) => {
    const pieces: SheetPlacedPiece[] = placements.map((p, idx) => {
      const original = originalPieces.find(op => op.id === p.id) || originalPieces[0];
      return {
        x: p.x,
        y: p.y,
        width: original.width,
        height: original.height,
        rotation: p.rotation,
        tag: original.tag,
        color: colors[idx % colors.length],
        originalPiece: original,
      };
    });

    const usedArea = pieces.reduce((sum, p) => {
      const w = p.rotation === 90 || p.rotation === 270 ? p.height : p.width;
      const h = p.rotation === 90 || p.rotation === 270 ? p.width : p.height;
      return sum + w * h;
    }, 0);

    const efficiency = (usedArea / sheetArea) * 100;
    const density = 7850; // kg/m³ aço
    const volumeM3 = (sheetWidth / 1000) * (sheetHeight / 1000) * (thickness / 1000);
    const weight = volumeM3 * density;

    return {
      id: `sheet-${sheetIdx}`,
      pieces,
      efficiency: Math.min(efficiency, 100),
      wasteArea: sheetArea - usedArea,
      utilizedArea: usedArea,
      weight,
    };
  });

  const totalSheets = sheets.length || 1;
  const totalWasteArea = sheets.reduce((sum, s) => sum + s.wasteArea, 0);
  const averageEfficiency = sheets.reduce((sum, s) => sum + s.efficiency, 0) / totalSheets;
  const totalWeight = sheets.reduce((sum, s) => sum + s.weight, 0);
  const materialCostPerKg = 5.5; // R$/kg

  return {
    sheets,
    totalSheets,
    totalWasteArea,
    averageEfficiency,
    totalWeight,
    materialCost: totalWeight * materialCostPerKg,
    optimizationMetrics: {
      algorithm: 'SVGnest NFP',
      optimizationTime: 0,
      convergence: true,
    },
  };
}

/**
 * Placeholder: Executa nesting NFP via SVGnest
 *
 * NOTA: A integração completa do SVGnest core (geometryutil.js + placementworker.js)
 * será feita quando os arquivos JS forem adicionados ao projeto.
 * Por enquanto, esta função usa o BottomLeftFill como fallback.
 */
export async function runSvgNest(
  pieces: SheetCutPiece[],
  sheetWidth: number,
  sheetHeight: number,
  config: Partial<NestConfig> = {},
): Promise<SheetOptimizationResult> {
  const nestConfig = { ...DEFAULT_CONFIG, ...config };

  console.log('=== SVGnest Engine ===');
  console.log(`Peças: ${pieces.length}, Chapa: ${sheetWidth}×${sheetHeight}mm`);
  console.log(`Config: spacing=${nestConfig.spacing}, rotations=${nestConfig.rotations}, generations=${nestConfig.generations}`);

  // Expandir peças por quantidade
  const expandedPieces: SheetCutPiece[] = [];
  for (const piece of pieces) {
    for (let i = 0; i < piece.quantity; i++) {
      expandedPieces.push({
        ...piece,
        id: `${piece.id}_${i}`,
        quantity: 1,
      });
    }
  }

  // Converter para polígonos
  const polygons = expandedPieces.map((p, i) => pieceToNestPolygon(p, i));
  console.log(`Polígonos gerados: ${polygons.length}`);

  // TODO: Quando SVGnest core for integrado, substituir por:
  // const result = await svgnestCore.nest(polygons, binPolygon, nestConfig);

  // Fallback: usar BottomLeftFill enquanto SVGnest core não está integrado
  const { BottomLeftFillOptimizer } = await import('../BottomLeftFill');
  const blf = new BottomLeftFillOptimizer(sheetWidth, sheetHeight, nestConfig.spacing);
  const blfResult = blf.optimize(pieces);

  console.log(`Resultado (fallback BLF): ${blfResult.totalSheets} chapas, ${blfResult.averageEfficiency.toFixed(1)}% eficiência`);

  // Marcar que foi gerado pelo engine NFP (mesmo usando fallback)
  return {
    ...blfResult,
    optimizationMetrics: {
      algorithm: 'SVGnest NFP (fallback BLF)',
      optimizationTime: 0,
      convergence: true,
    },
  };
}
