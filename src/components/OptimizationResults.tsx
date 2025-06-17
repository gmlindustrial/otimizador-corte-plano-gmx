
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizationResult, Project } from '@/pages/Index';
import { BarChart, Download, Printer, FileSpreadsheet, FileText, Wrench } from 'lucide-react';
import { ReportVisualization } from './ReportVisualization';
import { PrintableReport } from './PrintableReport';
import { useState } from 'react';

interface OptimizationResultsProps {
  results: OptimizationResult;
  barLength: number;
  project: Project | null;
}

export const OptimizationResults = ({ results, barLength, project }: OptimizationResultsProps) => {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printMode, setPrintMode] = useState<'complete' | 'simplified'>('complete');

  const handlePrint = (mode: 'complete' | 'simplified') => {
    setPrintMode(mode);
    setShowPrintPreview(true);
    
    // Small delay to ensure the content is rendered before printing
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 100);
  };

  const handleExportPDF = () => {
    console.log('Export PDF - Implementação futura');
  };

  const handleExportExcel = () => {
    console.log('Export Excel - Implementação futura');
  };

  if (showPrintPreview) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <div className="no-print p-4 bg-gray-100 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Visualização de Impressão - {printMode === 'complete' ? 'Relatório Completo' : 'Plano Simplificado'}
          </h2>
          <Button 
            onClick={() => setShowPrintPreview(false)} 
            variant="outline"
          >
            Fechar Visualização
          </Button>
        </div>
        <PrintableReport 
          results={results}
          barLength={barLength}
          project={project}
          mode={printMode}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Estatístico */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Resumo da Otimização
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
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
        </CardContent>
      </Card>

      {/* Visualização Detalhada */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg">Plano de Corte Detalhado</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="max-h-96 overflow-y-auto">
            <ReportVisualization 
              results={results}
              barLength={barLength}
              showLegend={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botões de Exportação */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Exportar Resultados</h4>
            
            {/* Modo de Impressão */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Modos de Impressão:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button 
                  onClick={() => handlePrint('complete')} 
                  variant="outline" 
                  className="justify-start"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Relatório Completo
                </Button>
                <Button 
                  onClick={() => handlePrint('simplified')} 
                  variant="outline" 
                  className="justify-start"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Plano Simplificado (Produção)
                </Button>
              </div>
            </div>

            {/* Outros Formatos */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Outros Formatos:</h5>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={handleExportPDF} variant="outline" className="justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button onClick={handleExportExcel} variant="outline" className="justify-start">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
