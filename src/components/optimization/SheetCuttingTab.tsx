import { SheetProjectSelector } from '@/components/sheet/SheetProjectSelector';
import { SheetMaterialInput } from '@/components/sheet/SheetMaterialInput';
import { SheetOptimizationResults } from '@/components/sheet/SheetOptimizationResults';
import { SheetVisualization } from '@/components/sheet/SheetVisualization';
import { SheetTechnicalReport } from '@/components/sheet/SheetTechnicalReport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, History, Download, Share2 } from 'lucide-react';
import { PDFReportService } from '@/services/PDFReportService';
import { useSheetOptimizationHistory } from '@/hooks/useSheetOptimizationHistory';
import { useToast } from '@/hooks/use-toast';
import type { SheetCutPiece, SheetProject, SheetOptimizationResult } from '@/types/sheet';

interface SheetCuttingTabProps {
  sheetProject: SheetProject | null;
  setSheetProject: (project: SheetProject | null) => void;
  sheetPieces: SheetCutPiece[];
  setSheetPieces: (pieces: SheetCutPiece[]) => void;
  sheetResults: SheetOptimizationResult | null;
  onOptimize: () => void;
}

export const SheetCuttingTab = ({
  sheetProject,
  setSheetProject,
  sheetPieces,
  setSheetPieces,
  sheetResults,
  onOptimize
}: SheetCuttingTabProps) => {
  const { toast } = useToast();
  const { saveOptimization, history, loadHistory } = useSheetOptimizationHistory();

  const handleOptimizeWithHistory = async () => {
    onOptimize();
    
    // Salvar no histórico após otimização
    if (sheetProject && sheetPieces.length > 0 && sheetResults) {
      await saveOptimization(
        sheetProject,
        sheetPieces,
        sheetResults,
        'MultiObjective',
        Date.now()
      );
    }
  };

  const handleGenerateReport = async () => {
    if (!sheetResults || !sheetProject) {
      toast({
        title: "Dados Insuficientes",
        description: "Execute uma otimização antes de gerar o relatório",
        variant: "destructive",
      });
      return;
    }

    try {
      await PDFReportService.generateSheetReport(sheetResults, sheetProject);
      toast({
        title: "Relatório Gerado",
        description: "Relatório técnico de chapas baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao Gerar Relatório",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    }
  };

  const handleLoadHistory = async () => {
    await loadHistory();
    toast({
      title: "Histórico Carregado",
      description: `${history.length} otimizações encontradas`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      {sheetResults && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sheetResults.totalSheets}</div>
                  <div className="text-sm text-gray-600">Chapas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{sheetResults.averageEfficiency.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Eficiência</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{sheetResults.totalWeight.toFixed(0)} kg</div>
                  <div className="text-sm text-gray-600">Peso</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerateReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Relatório
                </Button>
                <Button variant="outline" size="sm" onClick={handleLoadHistory}>
                  <History className="w-4 h-4 mr-2" />
                  Histórico
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SheetProjectSelector
            project={sheetProject}
            setProject={setSheetProject}
          />
          
          <SheetMaterialInput
            pieces={sheetPieces}
            setPieces={setSheetPieces}
            onOptimize={handleOptimizeWithHistory}
            disabled={!sheetProject}
          />
        </div>
        
        <div className="lg:col-span-1">
          {sheetResults && (
            <SheetOptimizationResults
              results={sheetResults}
              project={sheetProject}
            />
          )}
        </div>
      </div>

      {sheetResults && (
        <SheetVisualization
          results={sheetResults}
          project={sheetProject}
        />
      )}

      {sheetResults && sheetProject && (
        <SheetTechnicalReport
          results={sheetResults}
          project={sheetProject}
          cuttingSequence={{
            totalDistance: 5000,
            piercePoints: 25
          }}
          optimizationMetrics={{
            algorithm: 'Multi-Objective',
            optimizationTime: 150,
            convergence: true,
            iterations: 50
          }}
        />
      )}
    </div>
  );
};
