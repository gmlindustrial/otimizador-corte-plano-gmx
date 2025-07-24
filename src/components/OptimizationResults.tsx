import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizationResult, Project, CutPiece } from '@/pages/Index';
import { BarChart, Download, Printer, FileSpreadsheet, FileText, Wrench, Fullscreen, Recycle, MapPin, DollarSign, Leaf, Package, Link, AlertTriangle } from 'lucide-react';
import { ReportVisualization } from './ReportVisualization';
import { PrintableReport } from './PrintableReport';
import { FullscreenReportViewer } from './reports/FullscreenReportViewer';
import { PDFReportService } from '@/services/PDFReportService';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { PecaComEmenda } from '@/types/project';

interface OptimizationResultsProps {
  results: OptimizationResult;
  barLength: number;
  project: Project | null;
  pieces: CutPiece[];
  onResultsChange?: (results: OptimizationResult) => void;
  listName?: string;
  pecasComEmenda?: PecaComEmenda[];
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

export const OptimizationResults = ({ 
  results, 
  barLength, 
  project, 
  pieces, 
  onResultsChange, 
  listName,
  pecasComEmenda = []
}: OptimizationResultsProps) => {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [printMode, setPrintMode] = useState<'complete' | 'simplified'>('complete');
  const { toast } = useToast();

  // Cast for accessing sustainability properties if they exist
  const extendedResults = results as ExtendedOptimizationResult;
  const hasSustainabilityData = extendedResults.sustainability;

  // Verificar se há emendas
  const hasEmendas = pecasComEmenda.length > 0;
  const totalEmendas = pecasComEmenda.reduce((total, peca) => total + peca.emendas.length, 0);

  // Cálculos para as novas métricas de peças e peso
  const calculateTotalPieces = () => {
    return results.bars.reduce((total, bar) => 
      total + bar.pieces.reduce((barTotal, piece: any) => 
        barTotal + (piece.quantidade || 1), 0), 0);
  };

  const calculateTotalWeight = () => {
        console.log(results.bars)
    return results.bars.reduce((total, bar) => 
      total + bar.pieces.reduce((barTotal, piece: any) => {
        // Priorizar peso extraído do arquivo, usar peso por metro como fallback
        const weight = piece.peso || (piece.peso_por_metro * piece.length / 1000) || 0;
        return barTotal + (weight * (piece.quantidade || 1));
      }, 0), 0);
  };

  const calculateCutPieces = () => {
    return results.bars.reduce((total, bar) => 
      total + bar.pieces.filter((piece: any) => piece.status === 'cortado' || piece.cortado === true).length, 0);
  };

  const calculateCutWeight = () => {
    return results.bars.reduce((total, bar) => 
      total + bar.pieces
        .filter((piece: any) => piece.status === 'cortado' || piece.cortado === true)
        .reduce((barTotal, piece: any) => {
          // Priorizar peso extraído do arquivo, usar peso por metro como fallback
          const weight = piece.peso || (piece.peso_por_metro * piece.length / 1000) || 0;
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

      await PDFReportService.generateCompleteLinearReport(results, barLength, project, listName);
      
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

      await PDFReportService.generateSimplifiedLinearReport(results, barLength, project, listName);
      
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
        'Tem Emenda',
        'Observações'
      ];
      
      const rows: string[][] = [headers];

      // Adicionar cada peça com informações de emendas
      results.bars.forEach((bar: any, barIndex) => {
        const barType = bar.type || 'new';
        const isLeftover = barType === 'leftover';
        
        bar.pieces.forEach((piece: any, pieceIndex) => {
          // Verificar se esta peça tem emenda
          const pecaComEmenda = pecasComEmenda.find(pe => 
            pe.tag === piece.tag || pe.posicao === piece.posicao
          );
          
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
            pecaComEmenda ? `SIM (${pecaComEmenda.emendas.length} emenda(s))` : 'NÃO', // Tem Emenda
            pecaComEmenda ? pecaComEmenda.observacoes || '' : '' // Observações
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
            'NÃO', // Tem Emenda
            '' // Observações (em branco)
          ]);
        }
      });

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
      link.setAttribute('download', `plano-corte-com-emendas-${project?.projectNumber || 'projeto'}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Excel Exportado",
        description: "Plano de corte com informações de emendas foi baixado",
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
        {/* Resumo Estatístico com Sustentabilidade e Emendas */}
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
              {hasEmendas && (
                <Badge variant="secondary" className="bg-orange-200 text-orange-800 ml-2">
                  <Link className="w-3 h-3 mr-1" />
                  Com Emendas
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
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.efficiency.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Eficiência</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{totalPieces}</div>
                <div className="text-sm text-gray-600">Total de Peças</div>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{totalWeight.toFixed(1)}kg</div>
                <div className="text-sm text-gray-600">Peso Total</div>
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

            {/* Informações de Emendas */}
            {hasEmendas && (
              <div className="border-t pt-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Link className="w-4 h-4 text-orange-600" />
                  Informações de Emendas
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="text-lg font-bold text-orange-600">{pecasComEmenda.length}</div>
                    <div className="text-xs text-gray-600">Peças com Emenda</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="text-lg font-bold text-orange-600">{totalEmendas}</div>
                    <div className="text-xs text-gray-600">Total de Emendas</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-600">
                      {pecasComEmenda.filter(p => p.statusQualidade === 'pendente').length}
                    </div>
                    <div className="text-xs text-gray-600">Pendentes QA</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="text-lg font-bold text-yellow-600">
                      {pecasComEmenda.filter(p => p.emendas.some(e => e.inspecaoObrigatoria)).length}
                    </div>
                    <div className="text-xs text-gray-600">Inspeção Obrigatória</div>
                  </div>
                </div>
                
                {/* Lista de peças com emenda */}
                <div className="mt-4 space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Peças com Emenda:</h5>
                  <div className="max-h-32 overflow-y-auto">
                    {pecasComEmenda.map((peca, index) => (
                      <div key={index} className="flex items-center justify-between text-xs bg-orange-50 p-2 rounded">
                        <span>{peca.tag || peca.posicao || `Peça ${index + 1}`}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {peca.emendas.length} emenda(s)
                          </Badge>
                          {peca.emendas.some(e => e.inspecaoObrigatoria) && (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Informações de Sustentabilidade */}
            {hasSustainabilityData && (
              <div className="border-t pt-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Recycle className="w-4 h-4 text-green-600" />
                  Métricas de Sustentabilidade
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">{extendedResults.sustainability.leftoverBarsUsed}</div>
                    <div className="text-xs text-gray-600">Sobras Utilizadas</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">{extendedResults.sustainability.newBarsUsed}</div>
                    <div className="text-xs text-gray-600">Barras Novas</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">{extendedResults.sustainability.materialReused.toFixed(2)}kg</div>
                    <div className="text-xs text-gray-600">Material Reutilizado</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">R$ {extendedResults.sustainability.totalEconomy.toFixed(2)}</div>
                    <div className="text-xs text-gray-600">Economia Total</div>
                  </div>
                </div>
              </div>
            )}
            
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

            {/* Ações e Exportação */}
            <div className="flex justify-between items-center mt-6">
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-1" onClick={() => handlePrint('complete')}>
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>
                <Button variant="outline" className="flex items-center gap-1" onClick={() => handlePrint('simplified')}>
                  <FileText className="w-4 h-4" />
                  Simplificado
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-1" onClick={handleExportExcel}>
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </Button>
                <Button variant="outline" className="flex items-center gap-1" onClick={handleExportPDF}>
                  <Download className="w-4 h-4" />
                  PDF Completo
                </Button>
                <Button variant="outline" className="flex items-center gap-1" onClick={handleExportSimplifiedPDF}>
                  <Download className="w-4 h-4" />
                  PDF Simplificado
                </Button>
                <Button variant="outline" className="flex items-center gap-1" onClick={() => setShowFullscreen(true)}>
                  <Fullscreen className="w-4 h-4" />
                  Fullscreen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Otimização */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Visualização da Otimização
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
