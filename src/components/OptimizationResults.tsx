import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizationResult, Project, CutPiece } from '@/pages/Index';
import { BarChart, Download, Printer, FileSpreadsheet, FileText, Wrench, Fullscreen, Recycle, MapPin, DollarSign, Leaf } from 'lucide-react';
import { ReportVisualization } from './ReportVisualization';
import { PrintableReport } from './PrintableReport';
import { FullscreenReportViewer } from './reports/FullscreenReportViewer';
import { PDFReportService } from '@/services/PDFReportService';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface OptimizationResultsProps {
  results: OptimizationResult;
  barLength: number;
  project: Project | null;
  pieces: CutPiece[];
  onResultsChange?: (results: OptimizationResult) => void;
}

// Interface estendida para suportar informações de sustentabilidade
interface ExtendedOptimizationResult extends OptimizationResult {
  sustainability?: {
    leftoverBarsUsed: number;
    newBarsUsed: number;
    materialReused: number;
    totalEconomy: number;
    wasteReduction: number;
    materialEfficiency: number;
    co2Savings: number;
    materialSavings: number;
  };
  totalLength?: number;
  wasteLength?: number;
}

export const OptimizationResults = ({ results, barLength, project, pieces, onResultsChange }: OptimizationResultsProps) => {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [printMode, setPrintMode] = useState<'complete' | 'simplified'>('complete');
  const { toast } = useToast();

  // Cast for accessing sustainability properties if they exist
  const extendedResults = results as ExtendedOptimizationResult;
  const hasSustainabilityData = extendedResults.sustainability;

  const handlePrint = (mode: 'complete' | 'simplified') => {
    setPrintMode(mode);
    setShowPrintPreview(true);
  };

  const handleExportPDF = async () => {
    try {
      if (!project) {
        toast({
          title: "Erro",
          description: "Dados do projeto não encontrados",
          variant: "destructive",
        });
        return;
      }

      await PDFReportService.generateCompleteLinearReport(results, barLength, project);
      
      toast({
        title: "PDF Exportado",
        description: "Relatório PDF completo foi gerado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Não foi possível gerar o relatório PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportSimplifiedPDF = async () => {
    try {
      if (!project) {
        toast({
          title: "Erro",
          description: "Dados do projeto não encontrados",
          variant: "destructive",
        });
        return;
      }

      await PDFReportService.generateSimplifiedLinearReport(results, barLength, project);
      
      toast({
        title: "PDF Simplificado Exportado",
        description: "Plano de corte simplificado foi gerado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF simplificado:', error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Não foi possível gerar o plano simplificado",
        variant: "destructive",
      });
    }
  };

  const handleExportExcelComplete = () => {
    if (!results || !project) {
      toast({
        title: "Erro",
        description: "Dados insuficientes para gerar o relatório",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Iniciando geração Excel completo...');
      
      // Preparar dados completos
      const data = [];
      
      // Cabeçalho
      data.push(['RELATÓRIO DE OTIMIZAÇÃO COMPLETO']);
      data.push(['Projeto:', project.name || project.projectNumber || 'N/A']);
      data.push(['Cliente:', project.client || 'N/A']);
      data.push(['Data:', new Date().toLocaleDateString('pt-BR')]);
      data.push([]);
      
      // Resumo executivo
      data.push(['RESUMO EXECUTIVO']);
      data.push(['Total de Barras:', results.bars.length]);
      data.push(['Comprimento Total (mm):', results.totalBars * barLength]);
      data.push(['Desperdício Total (mm):', results.totalWaste]);
      data.push(['Eficiência:', `${results.efficiency.toFixed(2)}%`]);
      data.push([]);

      // Calcular total de peças 
      const totalPecas = results.bars.reduce((total, bar) => total + bar.pieces.length, 0);

      // Plano de corte detalhado
      data.push(['PLANO DE CORTE DETALHADO']);
      data.push(['Número da Barra', 'Tipo', 'TAG da Peça', 'Conjunto', 'Comprimento (mm)', 'Quantidade', 'Perfil/Material', 'Posição', 'Sobra (mm)', 'Observações']);
      
      results.bars.forEach((bar, index) => {
        bar.pieces.forEach((piece, pieceIndex) => {
          data.push([
            `Barra ${index + 1}`,
            'Linear',
            piece.tag || piece.label,
            'N/A',
            piece.length,
            1,
            'Material Padrão',
            `${pieceIndex + 1}°`,
            pieceIndex === bar.pieces.length - 1 ? bar.waste : 0,
            bar.waste > 0 && pieceIndex === bar.pieces.length - 1 ? `Sobra: ${bar.waste}mm` : ''
          ]);
        });
      });

      data.push([]);
      
      // Seção de sustentabilidade
      data.push(['MÉTRICAS DE SUSTENTABILIDADE']);
      data.push(['Eficiência do Material:', `${results.efficiency.toFixed(2)}%`]);
      data.push(['Redução de Desperdício:', `${results.wastePercentage.toFixed(2)}%`]);
      data.push(['Economia de CO2 (estimada):', `${(results.totalBars * barLength * 0.001).toFixed(2)} kg`]);
      data.push(['Economia Material (estimada):', `R$ ${(results.totalWaste * 0.05).toFixed(2)}`]);
      data.push([]);

      // Controle de qualidade
      data.push(['CONTROLE DE QUALIDADE']);
      data.push(['Total de Peças:', totalPecas]);
      data.push(['Barras Utilizadas:', results.bars.length]);
      data.push(['Status:', results.bars.length > 0 ? 'APROVADO' : 'PENDENTE']);

      // Gerar e baixar Excel
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório Completo');
      XLSX.writeFile(wb, `relatorio_completo_${(project.name || project.projectNumber || 'projeto').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "Sucesso",
        description: "Relatório Excel completo exportado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar Excel completo:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o relatório Excel completo",
        variant: "destructive",
      });
    }
  };

  const handleExportExcelSimplified = () => {
    if (!results || !project) {
      toast({
        title: "Erro",
        description: "Dados insuficientes para gerar o relatório",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Iniciando geração Excel simplificado...');
      
      // Preparar dados simplificados
      const data = [];
      
      // Cabeçalho básico
      data.push(['PLANO DE CORTE - OPERADOR']);
      data.push(['Projeto:', project.name || project.projectNumber || 'N/A']);
      data.push(['Data:', new Date().toLocaleDateString('pt-BR')]);
      data.push([]);
      
      // Resumo básico
      data.push(['Total de Barras:', results.bars.length]);
      data.push(['Eficiência:', `${results.efficiency.toFixed(1)}%`]);
      data.push([]);

      // Plano de corte simplificado
      data.push(['PLANO DE CORTE']);
      data.push(['Barra', 'TAG', 'Comprimento (mm)', 'Quantidade', 'Material']);
      
      results.bars.forEach((bar, index) => {
        bar.pieces.forEach((piece) => {
          data.push([
            `Barra ${index + 1}`,
            piece.tag || piece.label,
            piece.length,
            1,
            'Material Padrão'
          ]);
        });
      });

      data.push([]);
      
      // Check-list básico
      data.push(['CHECK-LIST DO OPERADOR']);
      data.push(['☐ Verificar material disponível']);
      data.push(['☐ Conferir medidas antes do corte']);
      data.push(['☐ Identificar peças após corte']);
      data.push(['☐ Separar sobras aproveitáveis']);

      // Gerar e baixar Excel
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plano Operador');
      XLSX.writeFile(wb, `plano_operador_${(project.name || project.projectNumber || 'projeto').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "Sucesso",
        description: "Plano do operador exportado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar Excel simplificado:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o plano do operador",
        variant: "destructive",
      });
    }
  };

  if (showPrintPreview) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col h-screen w-screen">
        <div className="p-4 bg-gray-100 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold">
            {printMode === 'complete' ? 'Relatório Completo' : 'Plano Simplificado'}
          </h2>
          <div className="flex items-center gap-2">
            <Button onClick={() => window.print()} variant="outline" className="flex items-center gap-1">
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
            <Button onClick={() => setShowPrintPreview(false)} variant="outline">
              Fechar Visualização
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="w-full h-full">
            <ReportVisualization
              results={results}
              barLength={barLength}
              showLegend={true}
            />
          </div>
          <div className="w-full">
            <PrintableReport
              results={results}
              barLength={barLength}
              project={project}
              pieces={pieces}
              mode={printMode}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Resumo Estatístico com Sustentabilidade */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Resumo da Otimização
              {hasSustainabilityData && hasSustainabilityData.leftoverBarsUsed > 0 && (
                <Badge variant="secondary" className="bg-green-200 text-green-800 ml-2">
                  <Recycle className="w-3 h-3 mr-1" />
                  Sustentável
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
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

            {/* Métricas de Sustentabilidade */}
            {hasSustainabilityData && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-600" />
                  Impacto Sustentável
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">{hasSustainabilityData.leftoverBarsUsed}</div>
                    <div className="text-xs text-gray-600">Sobras Usadas</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">{(hasSustainabilityData.materialReused / 1000).toFixed(1)}m</div>
                    <div className="text-xs text-gray-600">Material Reutilizado</div>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 rounded">
                    <div className="text-lg font-bold text-emerald-600 flex items-center justify-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {hasSustainabilityData.totalEconomy.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-600">Economia (R$)</div>
                  </div>
                  <div className="text-center p-2 bg-teal-50 rounded">
                    <div className="text-lg font-bold text-teal-600">{hasSustainabilityData.wasteReduction.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600">Redução Desperdício</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visualização Detalhada com Indicadores de Sobras */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Plano de Corte Detalhado por Conjunto</span>
              <div className="flex items-center gap-2">
                {hasSustainabilityData && hasSustainabilityData.leftoverBarsUsed > 0 && (
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    <Recycle className="w-3 h-3 mr-1" />
                    {hasSustainabilityData.leftoverBarsUsed} sobra(s) reutilizada(s)
                  </Badge>
                )}
                <Button 
                  onClick={() => setShowFullscreen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Fullscreen className="w-4 h-4" />
                  Visualizar em Tela Cheia
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ReportVisualization 
              results={results}
              barLength={barLength}
              showLegend={true}
            />
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
                    Exportar PDF Completo
                  </Button>
                  <Button onClick={handleExportSimplifiedPDF} variant="outline" className="justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF Simplificado (Produção)
                  </Button>
                  <Button onClick={handleExportExcelComplete} variant="outline" className="justify-start">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar Excel Completo
                  </Button>
                  <Button onClick={handleExportExcelSimplified} variant="outline" className="justify-start">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar Excel Simplificado (Operador)
                    {hasSustainabilityData && hasSustainabilityData.leftoverBarsUsed > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">+Sustentabilidade</Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fullscreen Viewer */}
      <FullscreenReportViewer
        isOpen={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        results={results}
        barLength={barLength}
        project={project}
        onResultsChange={onResultsChange}
      />
    </>
  );
};
