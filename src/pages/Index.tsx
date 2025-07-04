
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast"
import { MaterialInput } from '@/components/MaterialInput';
import { ProjectWizard } from '@/components/ProjectWizard';
import { CadastroManagerIntegrated } from '@/components/CadastroManagerIntegrated';
import type { CutPiece } from '@/types/cutPiece';
import type { Project } from '@/types/project';
import type { OptimizationResult } from '@/types/optimization';

const Index = () => {
  const { toast } = useToast();
  const [pieces, setPieces] = useState<CutPiece[]>([]);
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showCadastroManager, setShowCadastroManager] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [barLength, setBarLength] = useState(6000);

  const handleOptimize = useCallback(async () => {
    if (pieces.length === 0) {
      toast({
        title: "Nenhuma peça cadastrada",
        description: "Adicione peças para otimizar o corte.",
      });
      return;
    }

    setIsOptimizing(true);
    setResults(null);

    try {
      // Simple optimization algorithm - First Fit Decreasing
      const sortedPieces: Array<{ length: number; originalIndex: number }> = [];
      pieces.forEach((piece, index) => {
        for (let i = 0; i < piece.quantity; i++) {
          sortedPieces.push({ length: piece.length, originalIndex: index });
        }
      });
      
      sortedPieces.sort((a, b) => b.length - a.length);

      const bars: Array<{
        id: string;
        pieces: Array<{ length: number; color: string; label: string }>;
        waste: number;
        totalUsed: number;
      }> = [];

      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

      sortedPieces.forEach((piece) => {
        const cutLoss = 3;
        let placed = false;

        for (const bar of bars) {
          const availableSpace = barLength - bar.totalUsed;
          const spaceNeeded = piece.length + (bar.pieces.length > 0 ? cutLoss : 0);
          
          if (availableSpace >= spaceNeeded) {
            bar.pieces.push({
              length: piece.length,
              color: colors[piece.originalIndex % colors.length],
              label: `${piece.length}mm`
            });
            bar.totalUsed += spaceNeeded;
            bar.waste = barLength - bar.totalUsed;
            placed = true;
            break;
          }
        }

        if (!placed) {
          const newBar = {
            id: `bar-${bars.length + 1}`,
            pieces: [{
              length: piece.length,
              color: colors[piece.originalIndex % colors.length],
              label: `${piece.length}mm`
            }],
            waste: 0,
            totalUsed: piece.length
          };
          newBar.waste = barLength - newBar.totalUsed;
          bars.push(newBar);
        }
      });

      const totalWaste = bars.reduce((sum, bar) => sum + bar.waste, 0);
      const totalMaterial = bars.length * barLength;
      const wastePercentage = (totalWaste / totalMaterial) * 100;

      const optimizationResult: OptimizationResult = {
        bars,
        totalBars: bars.length,
        totalWaste,
        wastePercentage,
        efficiency: 100 - wastePercentage
      };

      setResults(optimizationResult);

      toast({
        title: "Otimização Concluída!",
        description: `Utilização: ${optimizationResult.efficiency.toFixed(2)}% de aproveitamento.`,
      });
    } catch (error: any) {
      console.error("Erro durante a otimização:", error);
      toast({
        variant: "destructive",
        title: "Erro na Otimização",
        description: error.message || "Ocorreu um erro ao otimizar o corte.",
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [pieces, barLength, toast]);

  const handleUpdateData = () => {
    console.log('Dados atualizados!');
  };

  if (showCadastroManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <CadastroManagerIntegrated onUpdateData={handleUpdateData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2">
            <MaterialInput
              pieces={pieces}
              setPieces={setPieces}
              onOptimize={handleOptimize}
              disabled={isOptimizing}
            />
          </div>

          <div className="col-span-1">
            <ProjectWizard
              project={project}
              setProject={setProject}
              barLength={barLength}
              setBarLength={setBarLength}
            />
          </div>
        </div>

        {results && (
          <div className="mt-12">
            <div className="bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Resultados da Otimização</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.totalBars}</div>
                  <div className="text-sm text-gray-600">Barras Utilizadas</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.efficiency.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Eficiência</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{(results.totalWaste / 1000).toFixed(2)}m</div>
                  <div className="text-sm text-gray-600">Desperdício</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{results.wastePercentage.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">% Desperdício</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
