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
  };
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

  const handleExportExcel = () => {
    try {
      // Estrutura melhorada com informações de sobras
      const headers = [
        'Barra',
        'Tipo',
        'Posição na Barra', 
        'TAG',
        'Conjunto',
        'Comprimento (mm)',
        'Perfil/Material',
        'Localização',
        'Economia',
        'Obra',
        'Status',
        'Eficiência Barra (%)',
        'Sobra Barra (mm)',
        'Observações'
      ];
      
      const rows: string[][] = [headers];

      // Adicionar cada peça com informações de sobras
      results.bars.forEach((bar: any, barIndex) => {
        const barType = bar.type || 'new';
        const isLeftover = barType === 'leftover';
        
        bar.pieces.forEach((piece: any, pieceIndex) => {
          rows.push([
            `Barra ${barIndex + 1}`, // Barra
            isLeftover ? 'SOBRA' : 'NOVA', // Tipo
            `${pieceIndex + 1}`, // Posição na Barra
            piece.tag || `P${pieceIndex + 1}`, // TAG
            piece.conjunto || 'Entrada Manual', // Conjunto
            piece.length.toString(), // Comprimento
            piece.perfil || piece.material || project?.tipoMaterial || 'Material', // Perfil/Material
            isLeftover ? (bar.location || 'Estoque') : 'Compra Nova', // Localização
            isLeftover ? `R$ ${((piece.length / 1000) * 8).toFixed(2)}` : 'R$ 0,00', // Economia
            piece.obra || project?.obra || 'N/A', // Obra
            isLeftover ? 'Reaproveitado' : 'Novo Material', // Status
            ((bar.totalUsed / (bar.originalLength || barLength)) * 100).toFixed(1), // Eficiência da Barra
            pieceIndex === bar.pieces.length - 1 ? bar.waste.toString() : '0', // Sobra apenas na última peça
            isLeftover ? `Sobra reutilizada - ${bar.location || 'Estoque'}` : 'Material novo' // Observações
          ]);
        });
        
        // Adicionar linha de sobra se existir
        if (bar.waste > 0) {
          rows.push([
            `Barra ${barIndex + 1}`,
            barType.toUpperCase(),
            'Sobra',
            'DESCARTE',
            '-',
            bar.waste.toString(),
            'Desperdício',
            isLeftover ? (bar.location || 'Estoque') : 'Descarte',
            'R$ 0,00',
            project?.obra || 'N/A',
            'Descarte',
            '0',
            bar.waste.toString(),
            isLeftover ? 'Sobra da sobra reutilizada' : 'Material a ser descartado'
          ]);
        }
      });

      // Adicionar seção de resumo por conjunto
      rows.push([]);
      rows.push(['=== RESUMO POR CONJUNTO ===']);
      
      // Agrupar por conjunto para resumo
      const conjuntoSummary = new Map<string, { count: number; totalLength: number; barras: Set<number> }>();
      
      results.bars.forEach((bar, barIndex) => {
        bar.pieces.forEach((piece: any) => {
          const conjunto = piece.conjunto || 'Entrada Manual';
          if (!conjuntoSummary.has(conjunto)) {
            conjuntoSummary.set(conjunto, { count: 0, totalLength: 0, barras: new Set() });
          }
          const summary = conjuntoSummary.get(conjunto)!;
          summary.count++;
          summary.totalLength += piece.length;
          summary.barras.add(barIndex + 1);
        });
      });

      rows.push(['Conjunto', 'Qtd Peças', 'Comprimento Total (mm)', 'Barras Utilizadas', 'Distribuição']);
      conjuntoSummary.forEach((summary, conjunto) => {
        rows.push([
          conjunto,
          summary.count.toString(),
          summary.totalLength.toString(),
          summary.barras.size.toString(),
          Array.from(summary.barras).sort((a, b) => a - b).join(', ')
        ]);
      });

      // Adicionar seção de sustentabilidade se houver dados
      if (hasSustainabilityData) {
        rows.push([]);
        rows.push(['=== RELATÓRIO DE SUSTENTABILIDADE ===']);
        rows.push(['Sobras Utilizadas:', hasSustainabilityData.leftoverBarsUsed.toString()]);
        rows.push(['Barras Novas:', hasSustainabilityData.newBarsUsed.toString()]);
        rows.push(['Material Reutilizado:', `${(hasSustainabilityData.materialReused / 1000).toFixed(2)}m`]);
        rows.push(['Economia Total:', `R$ ${hasSustainabilityData.totalEconomy.toFixed(2)}`]);
        rows.push(['Redução de Desperdício:', `${hasSustainabilityData.wasteReduction.toFixed(1)}%`]);
        rows.push(['Taxa de Reaproveitamento:', `${((hasSustainabilityData.leftoverBarsUsed / results.totalBars) * 100).toFixed(1)}%`]);
      }

      // Adicionar seção de controle de qualidade
      rows.push([]);
      rows.push(['=== CONTROLE DE QUALIDADE ===']);
      rows.push(['Projeto:', project?.projectNumber || 'N/A']);
      rows.push(['Cliente:', project?.client || 'N/A']);
      rows.push(['Obra:', project?.obra || 'N/A']);
      rows.push(['Operador:', project?.operador || 'N/A']);
      rows.push(['Turno:', project?.turno || 'N/A']);
      rows.push(['Aprovador QA:', project?.aprovadorQA || 'Pendente']);
      rows.push(['Material:', project?.tipoMaterial || 'N/A']);
      rows.push(['Total de Barras:', results.totalBars.toString()]);
      rows.push(['Eficiência Geral:', `${results.efficiency.toFixed(1)}%`]);
      rows.push(['Desperdício Total:', `${(results.totalWaste / 1000).toFixed(2)}m`]);
      rows.push(['Data da Otimização:', new Date().toLocaleDateString('pt-BR')]);
      rows.push([]);
      rows.push(['=== VALIDAÇÕES ===']);
      rows.push(['☐ Dimensões das barras conferidas']);
      rows.push(['☐ Material correto selecionado']);
      rows.push(['☐ TAGs das peças verificadas']);
      rows.push(['☐ Conjuntos organizados corretamente']);
      rows.push(['☐ Primeira peça cortada e validada']);
      rows.push(['☐ Relatório aprovado pelo operador']);
      rows.push(['☐ Assinatura do inspetor QA']);

      // Converter para CSV com encoding UTF-8 e separador adequado para Excel brasileiro
      const BOM = '\uFEFF'; // Byte Order Mark para UTF-8
      const csvContent = BOM + rows.map(row => 
        row.map(cell => `"${cell}"`).join(';') // Usar ponto e vírgula para Excel brasileiro
      ).join('\n');

      // Download com nome mais descritivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `plano-corte-operador-${project?.projectNumber || 'projeto'}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Excel Exportado",
        description: "Plano de corte com informações de sustentabilidade foi baixado",
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: "Erro ao exportar Excel",
        description: "Não foi possível gerar o arquivo Excel",
        variant: "destructive",
      });
    }
  };

  if (showPrintPreview) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col print:overflow-visible">
        {/* Cabeçalho da visualização - oculto na impressão */}
        <div className="flex-shrink-0 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-bold text-gray-900">
            {printMode === 'complete' ? 'Relatório Completo' : 'Plano Simplificado'}
          </h2>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => window.print()} 
              variant="default" 
              size="lg"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="w-5 h-5" />
              Imprimir
            </Button>
            <Button 
              onClick={() => setShowPrintPreview(false)} 
              variant="outline" 
              size="lg"
              className="border-gray-300"
            >
              Fechar Visualização
            </Button>
          </div>
        </div>
        
        {/* Conteúdo do relatório - com scroll */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-none print:p-4 print:space-y-4 print:overflow-visible">
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .print\\:hidden {
                display: none !important;
              }
              
              .print\\:block {
                display: block !important;
              }
              
              .print\\:overflow-visible {
                overflow: visible !important;
              }
              
              .print\\:p-4 {
                padding: 1rem !important;
              }
              
              .print\\:space-y-4 > * + * {
                margin-top: 1rem !important;
              }
              
              table {
                page-break-inside: auto !important;
              }
              
              tr {
                page-break-inside: avoid !important;
                page-break-after: auto !important;
              }
              
              svg {
                max-width: 100% !important;
                height: auto !important;
              }
              
              .fixed {
                position: static !important;
              }
              
              .flex-1 {
                flex: none !important;
              }
            }
          `}</style>
          
          <ReportVisualization
            results={results}
            barLength={barLength}
            showLegend={true}
          />
          <PrintableReport
            results={results}
            barLength={barLength}
            project={project}
            pieces={pieces}
            mode={printMode}
          />
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
          <CardContent className="p-8">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center p-6 bg-blue-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl font-bold text-blue-600 mb-2">{results.totalBars}</div>
                <div className="text-base text-gray-700 font-medium">Barras Utilizadas</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl font-bold text-green-600 mb-2">{results.efficiency.toFixed(1)}%</div>
                <div className="text-base text-gray-700 font-medium">Eficiência</div>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl font-bold text-red-600 mb-2">{(results.totalWaste / 1000).toFixed(2)}m</div>
                <div className="text-base text-gray-700 font-medium">Desperdício</div>
              </div>
              <div className="text-center p-6 bg-yellow-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl font-bold text-yellow-600 mb-2">{results.wastePercentage.toFixed(1)}%</div>
                <div className="text-base text-gray-700 font-medium">% Desperdício</div>
              </div>
            </div>

            {/* Métricas de Sustentabilidade */}
            {hasSustainabilityData && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-600" />
                  Impacto Sustentável
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600 mb-1">{hasSustainabilityData.leftoverBarsUsed}</div>
                    <div className="text-sm text-gray-700">Sobras Usadas</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{(hasSustainabilityData.materialReused / 1000).toFixed(1)}m</div>
                    <div className="text-sm text-gray-700">Material Reutilizado</div>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="text-2xl font-bold text-emerald-600 flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="w-4 h-4" />
                      {hasSustainabilityData.totalEconomy.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-700">Economia (R$)</div>
                  </div>
                  <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="text-2xl font-bold text-teal-600 mb-1">{hasSustainabilityData.wasteReduction.toFixed(1)}%</div>
                    <div className="text-sm text-gray-700">Redução Desperdício</div>
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
          <CardContent className="p-8">
            <div className="scale-110 origin-top-left transform">
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
                    Exportar PDF Completo
                  </Button>
                  <Button onClick={handleExportSimplifiedPDF} variant="outline" className="justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF Simplificado (Produção)
                  </Button>
                  <Button onClick={handleExportExcel} variant="outline" className="justify-start">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar Plano do Operador (Excel)
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
