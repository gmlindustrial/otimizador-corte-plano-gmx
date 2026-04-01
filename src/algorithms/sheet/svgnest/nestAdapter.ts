/**
 * nestAdapter.ts — Adapter entre SheetCutPiece e SVGnest
 *
 * Responsabilidades:
 * 1. Carregar GeometryUtil e ClipperLib como globais (window)
 * 2. Converter SheetCutPiece[] → polígonos SVGnest
 * 3. Converter holes {center, radius} → polygon .children[]
 * 4. Chamar SvgNest.nestFromPolygons() com Promise wrapper
 * 5. Converter resultado → SheetOptimizationResult
 */

import type {
  SheetCutPiece,
  SheetPlacedPiece,
  SheetOptimizationResult,
} from '@/types/sheet';

declare global {
  interface Window {
    GeometryUtil: any;
    ClipperLib: any;
    SvgNest: any;
  }
}

// Carrega um script no main thread e espera ficar disponível em window
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Já carregado?
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }

    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(script);
  });
}

// Carrega globals necessários para SVGnest funcionar no main thread
async function ensureGlobals(): Promise<void> {
  if (!window.ClipperLib) {
    await loadScript('/svgnest/clipper.js');
  }
  if (!window.GeometryUtil) {
    await loadScript('/svgnest/geometryutil.js');
  }
  // SVGnest se auto-registra em window.SvgNest ao carregar
  if (!window.SvgNest) {
    // Carregar parallel.js primeiro (SVGnest depende dele)
    await loadScript('/svgnest/parallel.js');
    // Depois carregar o svgnest.js adaptado (está no src/, carregado via import)
    const svgnestModule = await import('./svgnest.js');
    // Se o IIFE já rodou, SvgNest está em window
  }
}

/**
 * Converte um círculo {center, radius} para polígono de 32 lados
 */
function circleToPolygon(center: { x: number; y: number }, radius: number, segments = 32): Array<{ x: number; y: number }> {
  const points = [];
  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return points;
}

/**
 * Converte SheetCutPiece para polígono no formato SVGnest
 * Retorna array de {x,y} com propriedades .id, .source, .children
 */
function pieceToNestPolygon(piece: SheetCutPiece, index: number): any {
  let points: Array<{ x: number; y: number }>;

  if (piece.geometry?.points && piece.geometry.points.length >= 3) {
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

  // SVGnest usa o array como polígono com propriedades extras
  const poly: any = points;
  poly.id = index;
  poly.source = index;

  // Converter holes para .children (polígonos internos)
  if ((piece as any).holes && (piece as any).holes.length > 0) {
    poly.children = (piece as any).holes.map((hole: any) =>
      circleToPolygon(hole.center, hole.radius)
    );
  }

  return poly;
}

/**
 * Cria polígono do bin (chapa retangular)
 */
function createBinPolygon(width: number, height: number): Array<{ x: number; y: number }> {
  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
}

/**
 * Converte resultado do SVGnest para SheetOptimizationResult
 */
function convertResult(
  nestResult: any,
  originalPieces: SheetCutPiece[],
  sheetWidth: number,
  sheetHeight: number,
  startTime: number,
): SheetOptimizationResult {
  const sheetArea = sheetWidth * sheetHeight;
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  if (!nestResult || !nestResult.placements) {
    return {
      sheets: [],
      totalSheets: 0,
      totalWasteArea: 0,
      averageEfficiency: 0,
      totalWeight: 0,
      materialCost: 0,
    };
  }

  // nestResult.placements é array de arrays (1 array por sheet/bin)
  const sheets = nestResult.placements.map((sheetPlacements: any[], sheetIdx: number) => {
    const pieces: SheetPlacedPiece[] = sheetPlacements.map((p: any, idx: number) => {
      const sourceIdx = typeof p.id === 'number' ? p.id : idx;
      const original = originalPieces[sourceIdx] || originalPieces[0];
      const rotation = p.rotation || 0;
      const w = (rotation === 90 || rotation === 270) ? original.height : original.width;
      const h = (rotation === 90 || rotation === 270) ? original.width : original.height;

      return {
        x: p.x || 0,
        y: p.y || 0,
        width: w,
        height: h,
        rotation,
        tag: original.tag,
        color: colors[idx % colors.length],
        originalPiece: original,
      };
    });

    const usedArea = pieces.reduce((sum, p) => sum + p.width * p.height, 0);
    const efficiency = Math.min((usedArea / sheetArea) * 100, 100);
    const density = 7850;
    const thickness = originalPieces[0]?.thickness || 6;
    const volumeM3 = (sheetWidth / 1000) * (sheetHeight / 1000) * (thickness / 1000);
    const weight = volumeM3 * density;

    return {
      id: `sheet-nfp-${sheetIdx}`,
      pieces,
      efficiency,
      wasteArea: sheetArea - usedArea,
      utilizedArea: usedArea,
      weight,
    };
  });

  const totalSheets = sheets.length || 1;
  const totalWasteArea = sheets.reduce((sum: number, s: any) => sum + s.wasteArea, 0);
  const averageEfficiency = sheets.reduce((sum: number, s: any) => sum + s.efficiency, 0) / totalSheets;
  const totalWeight = sheets.reduce((sum: number, s: any) => sum + s.weight, 0);
  const materialCostPerKg = 5.5;

  return {
    sheets,
    totalSheets,
    totalWasteArea,
    averageEfficiency,
    totalWeight,
    materialCost: totalWeight * materialCostPerKg,
    optimizationMetrics: {
      algorithm: 'SVGnest NFP',
      optimizationTime: Date.now() - startTime,
      convergence: true,
    },
  };
}

/**
 * Executa nesting via SVGnest com NFP real.
 * Retorna Promise<SheetOptimizationResult>.
 */
export async function runNesting(
  pieces: SheetCutPiece[],
  sheetWidth: number,
  sheetHeight: number,
  kerf: number,
  options: { rotations?: number; populationSize?: number; mutationRate?: number; generations?: number } = {},
): Promise<SheetOptimizationResult> {
  const startTime = Date.now();

  console.log('=== SVGnest NFP Adapter ===');
  console.log(`Peças: ${pieces.length}, Chapa: ${sheetWidth}×${sheetHeight}mm, Kerf: ${kerf}mm`);

  // 1. Carregar dependências globais
  await ensureGlobals();

  if (!window.SvgNest) {
    throw new Error('SVGnest não carregou corretamente');
  }

  // 2. Expandir peças por quantidade e converter para formato SVGnest
  const expandedPolygons: any[] = [];
  let polyIndex = 0;
  for (const piece of pieces) {
    for (let i = 0; i < piece.quantity; i++) {
      expandedPolygons.push(pieceToNestPolygon(piece, polyIndex));
      polyIndex++;
    }
  }

  console.log(`Polígonos expandidos: ${expandedPolygons.length}`);

  // 3. Criar bin polygon
  const binPoly = createBinPolygon(sheetWidth, sheetHeight);

  // 4. Chamar nestFromPolygons com Promise wrapper
  const nestConfig = {
    spacing: kerf,
    rotations: options.rotations || 4,
    populationSize: options.populationSize || 10,
    mutationRate: options.mutationRate || 10,
  };

  return new Promise<SheetOptimizationResult>((resolve) => {
    window.SvgNest.nestFromPolygons(expandedPolygons, binPoly, nestConfig, null);

    // Polling para resultado (SVGnest é baseado em interval/callback)
    const maxWait = (options.generations || 30) * 2000; // ~2s por geração
    const pollInterval = 500;
    let elapsed = 0;

    const poll = setInterval(() => {
      elapsed += pollInterval;
      const result = window.SvgNest.getBestResult();

      if (result && result.placements) {
        clearInterval(poll);
        window.SvgNest.stop();
        console.log(`NFP concluído em ${Date.now() - startTime}ms, ${result.numPlaced}/${result.numTotal} peças posicionadas`);

        // Converter para nosso formato
        const expandedPieces = pieces.flatMap(p =>
          Array.from({ length: p.quantity }, () => p)
        );
        resolve(convertResult(result, expandedPieces, sheetWidth, sheetHeight, startTime));
      } else if (elapsed >= maxWait) {
        clearInterval(poll);
        window.SvgNest.stop();
        console.warn('NFP timeout — retornando melhor resultado parcial');

        const partialResult = window.SvgNest.getBestResult();
        const expandedPieces = pieces.flatMap(p =>
          Array.from({ length: p.quantity }, () => p)
        );
        resolve(convertResult(partialResult, expandedPieces, sheetWidth, sheetHeight, startTime));
      }
    }, pollInterval);
  });
}
