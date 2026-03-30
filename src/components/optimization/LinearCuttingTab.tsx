import React, { useState } from 'react';
import { MaterialInput } from '@/components/MaterialInput';
import { OptimizationResults } from '@/components/OptimizationResults';
import { OptimizationAnalysis } from './OptimizationAnalysis';
import { useAdvancedLinearOptimization } from '@/hooks/useAdvancedLinearOptimization';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Layers, Info } from 'lucide-react';
import type { Project, CutPiece, OptimizationResult } from '@/pages/Index';

interface LinearCuttingTabProps {
  project: Project | null;
  setProject: (project: Project | null) => void;
  barLength: number;
  setBarLength: (length: number) => void;
  pieces: CutPiece[];
  setPieces: (pieces: CutPiece[]) => void;
  results: OptimizationResult | null;
  onOptimize: () => void;
}

export const LinearCuttingTab = ({
  project: legacyProject,
  setProject: setLegacyProject,
  barLength: legacyBarLength,
  setBarLength: setLegacyBarLength,
  pieces: legacyPieces,
  setPieces: setLegacyPieces,
  results: legacyResults,
  onOptimize: legacyOnOptimize
}: LinearCuttingTabProps) => {
  const {
    project,
    setProject,
    barLength,
    setBarLength,
    pieces,
    setPieces,
    results,
    preAnalysis,
    bundleResults,
    isAnalyzing,
    isOptimizing,
    runPreAnalysis,
    runAdvancedOptimization
  } = useAdvancedLinearOptimization();

  const [bundleEnabled, setBundleEnabled] = useState(false);

  // Sincronizar com props legadas para compatibilidade
  React.useEffect(() => {
    if (legacyProject) setProject(legacyProject);
  }, [legacyProject, setProject]);

  React.useEffect(() => {
    setBarLength(legacyBarLength);
  }, [legacyBarLength, setBarLength]);

  React.useEffect(() => {
    setPieces(legacyPieces);
  }, [legacyPieces, setPieces]);

  return (
    <div className="space-y-6">
      <MaterialInput
        project={legacyProject}
        pieces={legacyPieces}
        setPieces={setLegacyPieces}
        onOptimize={() => runAdvancedOptimization(bundleEnabled)}
      />

      {/* Toggle Amarrado */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="bundle-toggle" className="text-sm font-medium cursor-pointer">
                    Otimizar por Amarrado
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Quando ativado, agrupa barras do mesmo perfil para corte simultâneo na serra fita.
                      A quantidade por amarrado é definida no cadastro do perfil.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {bundleEnabled
                    ? 'Peças serão agrupadas por perfil para corte em amarrado'
                    : 'Cada barra será cortada individualmente'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bundleEnabled && (
                <Badge variant="secondary" className="text-xs">
                  Amarrado ativo
                </Badge>
              )}
              <Switch
                id="bundle-toggle"
                checked={bundleEnabled}
                onCheckedChange={setBundleEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise Inteligente */}
      <OptimizationAnalysis
        analysis={preAnalysis}
        isAnalyzing={isAnalyzing}
        isOptimizing={isOptimizing}
        onRunAnalysis={runPreAnalysis}
        onRunOptimization={() => runAdvancedOptimization(bundleEnabled)}
        piecesCount={pieces.length}
      />

      {/* Resumo do Amarrado */}
      {bundleEnabled && bundleResults && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3 mb-3">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Resumo do Amarrado</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-secondary rounded-lg">
                <p className="text-2xl font-bold text-primary">{bundleResults.summary.totalBundles}</p>
                <p className="text-xs text-muted-foreground">Amarrado(s)</p>
              </div>
              <div className="text-center p-3 bg-secondary rounded-lg">
                <p className="text-2xl font-bold">{bundleResults.summary.totalBars}</p>
                <p className="text-xs text-muted-foreground">Barras totais</p>
              </div>
              <div className="text-center p-3 bg-secondary rounded-lg">
                <p className="text-2xl font-bold text-green-500">{bundleResults.summary.averageEfficiency.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Eficiência</p>
              </div>
              <div className="text-center p-3 bg-secondary rounded-lg">
                <p className="text-2xl font-bold text-orange-500">{bundleResults.summary.setupTimeSaved.toFixed(0)}min</p>
                <p className="text-xs text-muted-foreground">Setup economizado</p>
              </div>
            </div>
            {bundleResults.bundles.map(b => (
              <div key={b.bundleId} className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  <Layers className="w-3 h-3 mr-1" />
                  ×{b.bundleSize}
                </Badge>
                <span>{b.profileDescription}</span>
                <span>— {b.pattern.pieces.length} peça(s)/barra, sobra {b.pattern.wastePerBar}mm</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resultados - apenas barras de corte */}
      {results && (
        <OptimizationResults
          results={{
            bars: (results as any).cuttableBars?.map((bar: any) => ({
              id: bar.id,
              pieces: bar.pieces,
              waste: bar.waste,
              totalUsed: bar.totalUsed
            })) || results.bars.filter((bar: any) =>
              bar.pieces.length > 1 || bar.waste < bar.originalLength * 0.8
            ),
            totalBars: (results as any).cuttableBars?.length || results.totalBars,
            totalWaste: results.totalWaste,
            wastePercentage: results.wastePercentage,
            efficiency: results.efficiency
          }}
          barLength={barLength}
          project={project}
          pieces={pieces}
        />
      )}
    </div>
  );
};
