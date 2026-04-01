/**
 * SheetAlgorithmComparison — Compara resultados de múltiplos algoritmos de nesting
 * Auto-otimiza (mostra o melhor) + botão "Ver Alternativas"
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Eye, EyeOff, Timer, Layers, TrendingUp } from 'lucide-react';
import type { SheetOptimizationResult } from '@/types/sheet';

export interface AlgorithmResult {
  name: string;
  label: string;
  result: SheetOptimizationResult;
  timeMs: number;
  isBest: boolean;
}

interface SheetAlgorithmComparisonProps {
  alternatives: AlgorithmResult[];
  onSelectAlternative: (result: SheetOptimizationResult) => void;
  selectedName: string;
}

export const SheetAlgorithmComparison = ({
  alternatives,
  onSelectAlternative,
  selectedName,
}: SheetAlgorithmComparisonProps) => {
  const [showAlternatives, setShowAlternatives] = useState(false);

  if (alternatives.length <= 1) return null;

  const best = alternatives.find(a => a.isBest);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Otimização Multi-Algoritmo
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAlternatives(!showAlternatives)}
          >
            {showAlternatives ? (
              <><EyeOff className="w-3.5 h-3.5 mr-1" /> Ocultar Alternativas</>
            ) : (
              <><Eye className="w-3.5 h-3.5 mr-1" /> Ver Alternativas ({alternatives.length})</>
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      {showAlternatives && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {alternatives.map((alt) => (
              <button
                key={alt.name}
                onClick={() => onSelectAlternative(alt.result)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left text-sm ${
                  selectedName === alt.name
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {alt.isBest && <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />}
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {alt.label}
                      {alt.isBest && <Badge className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Melhor</Badge>}
                      {selectedName === alt.name && <Badge variant="outline" className="text-xs">Selecionado</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="text-right">
                    <span className="font-medium text-foreground">{alt.result.averageEfficiency.toFixed(1)}%</span>
                    <span className="text-xs ml-1">eficiência</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-foreground">{alt.result.totalSheets}</span>
                    <span className="text-xs ml-1">chapa(s)</span>
                  </div>
                  <div className="text-right flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    <span className="text-xs">{alt.timeMs}ms</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

/**
 * Roda múltiplos algoritmos e retorna resultados ordenados por eficiência
 */
export async function runMultiAlgorithmOptimization(
  pieces: import('@/types/sheet').SheetCutPiece[],
  sheetWidth: number,
  sheetHeight: number,
  kerf: number,
  thickness?: number,
  material?: string,
): Promise<AlgorithmResult[]> {
  const results: AlgorithmResult[] = [];

  // 1. Bottom-Left Fill (rápido)
  try {
    const { BottomLeftFillOptimizer } = await import('@/algorithms/sheet/BottomLeftFill');
    const start = performance.now();
    const optimizer = new BottomLeftFillOptimizer(sheetWidth, sheetHeight, kerf);
    const result = optimizer.optimize(pieces);
    const timeMs = Math.round(performance.now() - start);
    results.push({ name: 'blf', label: 'Bottom-Left Fill', result, timeMs, isBest: false });
  } catch (e) {
    console.warn('BLF falhou:', e);
  }

  // 2. Genetic Algorithm
  try {
    const { GeneticOptimizer } = await import('@/algorithms/sheet/GeneticOptimizer');
    const start = performance.now();
    const optimizer = new GeneticOptimizer(sheetWidth, sheetHeight, kerf, thickness || 6, material || 'A36');
    const result = optimizer.optimize(pieces);
    const timeMs = Math.round(performance.now() - start);
    results.push({ name: 'genetic', label: 'Algoritmo Genético', result, timeMs, isBest: false });
  } catch (e) {
    console.warn('Genetic falhou:', e);
  }

  // 3. MaxRects Packer
  try {
    const { MaxRectsPacker } = await import('@/algorithms/sheet/MaxRectsPacker');
    const start = performance.now();
    const optimizer = new MaxRectsPacker(sheetWidth, sheetHeight, kerf);
    const result = optimizer.optimize(pieces);
    const timeMs = Math.round(performance.now() - start);
    results.push({ name: 'maxrects', label: 'MaxRects Packer', result, timeMs, isBest: false });
  } catch (e) {
    console.warn('MaxRects falhou:', e);
  }

  // 4. SVGnest NFP (Geometria Irregular)
  try {
    const { runNesting } = await import('@/algorithms/sheet/svgnest/nestAdapter');
    const start = performance.now();
    const result = await runNesting(pieces, sheetWidth, sheetHeight, kerf, { rotations: 4 });
    const timeMs = Math.round(performance.now() - start);
    results.push({ name: 'nfp', label: 'NFP (Geometria Irregular)', result, timeMs, isBest: false });
  } catch (e) {
    console.warn('NFP falhou:', e);
  }

  // Ordenar por eficiência (melhor primeiro)
  results.sort((a, b) => b.result.averageEfficiency - a.result.averageEfficiency);

  // Marcar o melhor
  if (results.length > 0) {
    results[0].isBest = true;
  }

  return results;
}
