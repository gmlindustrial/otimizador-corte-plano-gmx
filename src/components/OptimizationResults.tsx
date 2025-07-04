import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizationResult, Project } from '@/pages/Index';
import { BarChart, Download, Printer, FileSpreadsheet, FileText, Wrench, Fullscreen } from 'lucide-react';
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
}

export const OptimizationResults = ({ results, barLength, project }: OptimizationResultsProps) => {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [printMode, setPrintMode] = useState<'complete' | 'simplified'>('complete');
  const { toast } = useToast();

  const handlePrint = (mode: 'complete' | 'simplified') => {
    setPrintMode(mode);
    setShowPrintPreview(true);
    
    // Small delay to ensure the content is rendered before printing
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 100);
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
      // Estrutura melhorada para operador com informações completas
      const headers = [
        'Barra',
        'Posição na Barra', 
        'TAG',
        'Conjunto',
        'Comprimento (mm)',
        'Perfil/Material',
        'Posição Original',
        'Obra',
        'Status',
        'Eficiência Barra (%)',
        'Sobra Barra (mm)',
        'Observações'
      ];
      
      const rows: string[][] = [headers];

      // Adicionar cada peça com informações completas organizadas por conjunto
      results.bars.forEach((bar, barIndex) => {
        bar.pieces.forEach((piece: any, pieceIndex) => {
          rows.push([
            `Barra ${barIndex + 1}`, // Barra
            `${pieceIndex + 1}`, // Posição na Barra
            piece.tag || `P${pieceIndex + 1}`, // TAG
            piece.conjunto || 'Entrada Manual', // Conjunto
            piece.length.toString(), // Comprimento
            piece.perfil || piece.material || project?.tipoMaterial || 'Material', // Perfil/Material
            piece.posicao?.toString() || `${pieceIndex + 1}`, // Posição Original
            piece.obra || project?.obra || 'N/A', // Obra
            'Otimizado', // Status
            ((bar.totalUsed / barLength) * 100).toFixed(1), // Eficiência da Barra
            pieceIndex === bar.pieces.length - 1 ? bar.waste.toString() : '0', // Sobra apenas na última peça
            piece.conjunto ? `Conjunto: ${piece.conjunto}` : 'Peça manual' // Observações
          ]);
        });
        
        // Adicionar linha de sobra se existir
        if (bar.waste > 0) {
          rows.push([
            `Barra ${barIndex + 1}`,
            'Sobra',
            'DESCARTE',
            '-',
            bar.waste.toString(),
            'Desperdício',
            '-',
            project?.obra || 'N/A',
            'Descarte',
            '0',
            bar.waste.toString(),
            'Material a ser descartado'
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
        description: "Plano de corte detalhado para operador foi baixado",
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
    <>
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
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Plano de Corte Detalhado por Conjunto</span>
              <Button 
                onClick={() => setShowFullscreen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Fullscreen className="w-4 h-4" />
                Visualizar em Tela Cheia
              </Button>
            </CardTitle>
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
                    Exportar PDF Completo
                  </Button>
                  <Button onClick={handleExportSimplifiedPDF} variant="outline" className="justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF Simplificado (Produção)
                  </Button>
                  <Button onClick={handleExportExcel} variant="outline" className="justify-start">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar Plano do Operador (Excel)
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
      />
    </>
  );
};
