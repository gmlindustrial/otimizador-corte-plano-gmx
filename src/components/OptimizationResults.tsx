import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizationResult, Project, CutPiece } from '@/pages/Index';
import { BarChart, Download, Printer, FileSpreadsheet, FileText, Wrench, Fullscreen, Recycle, MapPin, DollarSign, Leaf, Package } from 'lucide-react';
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

  // Cálculos para as novas métricas de peças e peso
  const calculateTotalPieces = () => {
    return results.bars.reduce((total, bar) => 
      total + bar.pieces.reduce((barTotal, piece: any) => 
        barTotal + (piece.quantidade || 1), 0), 0);
  };

  const calculateTotalWeight = () => {
    return results.bars.reduce((total, bar) => 
      total + bar.pieces.reduce((barTotal, piece: any) => {
        // Priorizar peso extraído do arquivo, usar peso por metro como fallback
        const weight = piece.peso || 0;
        return barTotal + (weight * (piece.quantidade || 1));
      }, 0), 0);
  };

  const calculateCutPieces = () => {
    return results.bars.reduce((total, bar) => 
      total + bar.pieces.filter((piece: any) => piece.cortada === true).length, 0);
  };

  const calculateCutWeight = () => {
    return results.bars.reduce((total, bar) => 
      total + bar.pieces
        .filter((piece: any) => piece.cortada === true)
        .reduce((barTotal, piece: any) => {
          // Priorizar peso extraído do arquivo, usar peso por metro como fallback
          const weight = piece.peso || 0;
          return barTotal + (weight * (piece.quantidade || 1));
        }, 0), 0);
  };

  const totalPieces = calculateTotalPieces();
  const totalWeight = calculateTotalWeight();
  const cutPieces = calculateCutPieces();
  const cutWeight = calculateCutWeight();

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
      // Estrutura melhorada conforme especificação do operador
        const headers = [
          'Numero da Barra',
          'Tipo (Nova ou Sobra)',
          'Posição',
          'TAG',
          'Quantidade',
          'Comprimento',
          'Perfil/Material',
          'Obra',
        'Status',
        'Eficiência',
        'Sobra Barra',
        'Observações'
      ];
      
      const rows: string[][] = [headers];

      // Adicionar cada peça com informações de sobras
      results.bars.forEach((bar: any, barIndex) => {
        const barType = bar.type || 'new';
        const isLeftover = barType === 'leftover';
        
        bar.pieces.forEach((piece: any, pieceIndex) => {
          rows.push([
            `Barra ${barIndex + 1}`, // Numero da Barra
            isLeftover ? 'SOBRA' : 'NOVA', // Tipo (Nova ou Sobra)
            piece.posicao || 'Manual', // Posição
            piece.tag || 'Entrada Manual', // TAG
            piece.quantidade || '1', // Quantidade
            piece.length.toString(), // Comprimento
            piece.perfil || piece.material || project?.tipoMaterial || 'Material', // Perfil/Material
            piece.obra || project?.obra || 'N/A', // Obra
            '', // Status (em branco)
            ((bar.totalUsed / (bar.originalLength || barLength)) * 100).toFixed(1), // Eficiência
            pieceIndex === bar.pieces.length - 1 ? bar.waste.toString() : '0', // Sobra Barra
            '' // Observações (em branco)
          ]);
        });
        
        // Adicionar linha de sobra se existir
          if (bar.waste > 0) {
            rows.push([
              `Barra ${barIndex + 1}`, // Numero da Barra
              barType.toUpperCase(), // Tipo (Nova ou Sobra)
              '-', // Posição
              'DESCARTE', // TAG
              '0', // Quantidade
              bar.waste.toString(), // Comprimento
            'Desperdício', // Perfil/Material
            project?.obra || 'N/A', // Obra
            '', // Status (em branco)
            '0', // Eficiência
            bar.waste.toString(), // Sobra Barra
            '' // Observações (em branco)
          ]);
        }
      });

      // Adicionar seção de resumo por conjunto
      rows.push([]);
      rows.push(['=== RESUMO POR TAG ===']);
      
      // Agrupar por TAG para resumo
      const tagSummary = new Map<string, { count: number; totalLength: number; barras: Set<number> }>();
      
      results.bars.forEach((bar, barIndex) => {
        bar.pieces.forEach((piece: any) => {
          const tag = piece.tag || 'Entrada Manual';
          if (!tagSummary.has(tag)) {
            tagSummary.set(tag, { count: 0, totalLength: 0, barras: new Set() });
          }
          const summary = tagSummary.get(tag)!;
          summary.count++;
          summary.totalLength += piece.length;
          summary.barras.add(barIndex + 1);
        });
      });

      rows.push(['TAG', 'Qtd Peças', 'Comprimento Total (mm)', 'Barras Utilizadas', 'Numero da Barra']);
      tagSummary.forEach((summary, tag) => {
        rows.push([
          tag,
          summary.count.toString(),
          summary.totalLength.toString(),
          summary.barras.size.toString(),
          Array.from(summary.barras).sort((a: number, b: number) => a - b).join(', ')
        ]);
      });

      // Adicionar totais gerais
      rows.push([]);
      rows.push(['=== TOTAIS GERAIS ===']);
      rows.push(['Total de Peças:', totalPieces.toString()]);
      rows.push(['Peso Total (kg):', totalWeight.toFixed(2)]);
      rows.push(['Peças Cortadas:', cutPieces.toString()]);
      rows.push(['Peso Peças Cortadas (kg):', cutWeight.toFixed(2)]);

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
      rows.push(['☐ TAGs organizados corretamente']);
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{results.totalBars}</div>
                <div className="text-sm text-gray-600">Barras Utilizadas</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{totalPieces}</div>
                <div className="text-sm text-gray-600">Total de Peças</div>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{totalWeight.toFixed(1)}kg</div>
                <div className="text-sm text-gray-600">Peso Total</div>
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

            {/* Informações de Peças Cortadas */}
            <div className="border-t pt-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-600" />
                Detalhes das Peças Cortadas
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center p-2 bg-slate-50 rounded">
                  <div className="text-lg font-bold text-slate-600">{cutPieces}</div>
                  <div className="text-xs text-gray-600">Peças Cortadas</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded">
                  <div className="text-lg font-bold text-slate-600">{cutWeight.toFixed(1)}kg</div>
                  <div className="text-xs text-gray-600">Peso das Peças Cortadas</div>
                </div>
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

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardContent className="p-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Exportar Resultados</h4>
              
        
              <div className="space-y-2">
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

        {/* Visualização Detalhada com Indicadores de Sobras */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Plano de Corte Detalhado por TAG</span>
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
