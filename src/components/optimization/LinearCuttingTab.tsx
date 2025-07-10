import React from 'react';
import { MaterialInput } from '@/components/MaterialInput';
import { OptimizationResults } from '@/components/OptimizationResults';
import { OptimizationAnalysis } from './OptimizationAnalysis';
import { useAdvancedLinearOptimization } from '@/hooks/useAdvancedLinearOptimization';
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
  // Usar o novo hook avançado
  const {
    project,
    setProject,
    barLength,
    setBarLength,
    pieces,
    setPieces,
    results,
    preAnalysis,
    isAnalyzing,
    isOptimizing,
    runPreAnalysis,
    runAdvancedOptimization
  } = useAdvancedLinearOptimization();

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
        setProject={setLegacyProject}
        barLength={legacyBarLength}
        setBarLength={setLegacyBarLength}
        pieces={legacyPieces}
        setPieces={setLegacyPieces}
        onOptimize={runAdvancedOptimization}
      />
      
      {/* Análise Inteligente */}
      <OptimizationAnalysis
        analysis={preAnalysis}
        isAnalyzing={isAnalyzing}
        isOptimizing={isOptimizing}
        onRunAnalysis={runPreAnalysis}
        onRunOptimization={runAdvancedOptimization}
        piecesCount={pieces.length}
      />
      
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