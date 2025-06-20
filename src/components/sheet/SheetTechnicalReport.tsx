
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  BarChart3, 
  Calculator,
  CheckCircle,
  AlertTriangle,
  Clock,
  Weight
} from 'lucide-react';
import type { SheetOptimizationResult, SheetProject } from '@/types/sheet';

interface SheetTechnicalReportProps {
  results: SheetOptimizationResult;
  project: SheetProject;
  cuttingSequence?: any;
  optimizationMetrics?: any;
}

export const SheetTechnicalReport = ({ 
  results, 
  project, 
  cuttingSequence,
  optimizationMetrics 
}: SheetTechnicalReportProps) => {
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [reportFormat, setReportFormat] = useState<'summary' | 'detailed' | 'production'>('summary');

  const generatePrintableReport = () => {
    const reportContent = document.getElementById('technical-report-content');
    if (reportContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Relatório Técnico - ${project.name}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .section { margin: 20px 0; }
                .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                .table th, .table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                .table th { background-color: #f5f5f5; }
                .signature { margin-top: 50px; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              ${reportContent.innerHTML}
              <div class="signature">
                <p>Operador: ${project.operador} | Turno: ${project.turno}</p>
                <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                <p>Assinatura: ________________________</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Chapa', 'Peça', 'Tag', 'Dimensões', 'Área', 'Posição X', 'Posição Y', 'Rotação'];
    const rows: string[][] = [headers];

    results.sheets.forEach((sheet, sheetIndex) => {
      sheet.pieces.forEach(piece => {
        rows.push([
          `Chapa ${sheetIndex + 1}`,
          piece.tag,
          piece.tag,
          `${piece.width}x${piece.height}mm`,
          `${(piece.width * piece.height / 1000000).toFixed(4)} m²`,
          `${piece.x.toFixed(2)}`,
          `${piece.y.toFixed(2)}`,
          `${piece.rotation}°`
        ]);
      });
    });

    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${project.projectNumber}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const calculateTotalCuttingTime = () => {
    if (!cuttingSequence) return 0;
    // Estimativa: distância / velocidade + tempo de perfuração
    const cuttingTime = cuttingSequence.totalDistance / 2000; // 2000 mm/min velocidade média
    const pierceTime = cuttingSequence.piercePoints * 0.5; // 0.5s por perfuração
    return cuttingTime + pierceTime;
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 85) return 'text-green-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyStatus = (efficiency: number) => {
    if (efficiency >= 85) return { icon: CheckCircle, text: 'Excelente', color: 'text-green-600' };
    if (efficiency >= 70) return { icon: AlertTriangle, text: 'Bom', color: 'text-yellow-600' };
    return { icon: AlertTriangle, text: 'Atenção', color: 'text-red-600' };
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-slate-700 to-gray-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Relatório Técnico Detalhado
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Controles do Relatório */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50">
              Projeto: {project.projectNumber}
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              {results.totalSheets} Chapa(s)
            </Badge>
            <Badge variant="outline" className="bg-purple-50">
              {results.averageEfficiency.toFixed(1)}% Eficiência
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={generatePrintableReport}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>

        <div id="technical-report-content">
          {/* Cabeçalho do Relatório */}
          <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">RELATÓRIO TÉCNICO DE OTIMIZAÇÃO</h1>
            <h2 className="text-lg text-gray-600">Corte de Chapas - Elite Soldas Ametista II</h2>
            <p className="text-sm text-gray-500 mt-2">
              Gerado em: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>

          <Tabs value={reportFormat} onValueChange={(value: any) => setReportFormat(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Resumo</TabsTrigger>
              <TabsTrigger value="detailed">Detalhado</TabsTrigger>
              <TabsTrigger value="production">Produção</TabsTrigger>
            </TabsList>

            {/* Aba Resumo */}
            <TabsContent value="summary" className="space-y-6">
              {/* Informações do Projeto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Dados do Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Projeto:</span>
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número:</span>
                      <span className="font-medium">{project.projectNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">{project.client}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Obra:</span>
                      <span className="font-medium">{project.obra}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lista:</span>
                      <span className="font-medium">{project.lista} | {project.revisao}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Especificações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chapa:</span>
                      <span className="font-medium">{project.sheetWidth}×{project.sheetHeight}mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Material:</span>
                      <span className="font-medium">{project.material}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Espessura:</span>
                      <span className="font-medium">{project.thickness}mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processo:</span>
                      <span className="font-medium">{project.process.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kerf:</span>
                      <span className="font-medium">{project.kerf}mm</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Métricas Principais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">{results.totalSheets}</div>
                  <div className="text-sm text-gray-600">Chapas</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <Calculator className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className={`text-2xl font-bold ${getEfficiencyColor(results.averageEfficiency)}`}>
                    {results.averageEfficiency.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Eficiência</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <Weight className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">{results.totalWeight.toFixed(0)} kg</div>
                  <div className="text-sm text-gray-600">Peso Total</div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">
                    {calculateTotalCuttingTime().toFixed(1)} min
                  </div>
                  <div className="text-sm text-gray-600">Tempo Est.</div>
                </div>
              </div>

              {/* Status da Eficiência */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Análise de Eficiência</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.sheets.map((sheet, index) => {
                      const status = getEfficiencyStatus(sheet.efficiency);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <status.icon className={`w-5 h-5 ${status.color}`} />
                            <span className="font-medium">Chapa {index + 1}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-32">
                              <Progress value={sheet.efficiency} className="h-2" />
                            </div>
                            <span className={`font-bold ${getEfficiencyColor(sheet.efficiency)}`}>
                              {sheet.efficiency.toFixed(1)}%
                            </span>
                            <Badge variant="outline" className={status.color}>
                              {status.text}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Detalhado */}
            <TabsContent value="detailed" className="space-y-6">
              {/* Seletor de Chapa */}
              <div className="flex items-center gap-4 mb-4">
                <span className="font-medium">Chapa:</span>
                {results.sheets.map((_, index) => (
                  <Button
                    key={index}
                    variant={selectedSheet === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSheet(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>

              {/* Detalhes da Chapa Selecionada */}
              <Card>
                <CardHeader>
                  <CardTitle>Chapa {selectedSheet + 1} - Detalhamento Completo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Métricas da Chapa</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Eficiência:</span>
                          <span className={`font-bold ${getEfficiencyColor(results.sheets[selectedSheet].efficiency)}`}>
                            {results.sheets[selectedSheet].efficiency.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Área Utilizada:</span>
                          <span>{(results.sheets[selectedSheet].utilizedArea / 1000000).toFixed(3)} m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Área Desperdiçada:</span>
                          <span>{(results.sheets[selectedSheet].wasteArea / 1000000).toFixed(3)} m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Peso da Chapa:</span>
                          <span>{results.sheets[selectedSheet].weight.toFixed(2)} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Número de Peças:</span>
                          <span>{results.sheets[selectedSheet].pieces.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Distribuição por Tamanho</h4>
                      <div className="space-y-2 text-sm">
                        {['Pequena', 'Média', 'Grande'].map((size, index) => {
                          const threshold = [0.01, 0.05, Infinity][index];
                          const prevThreshold = [0, 0.01, 0.05][index];
                          const count = results.sheets[selectedSheet].pieces.filter(piece => {
                            const area = piece.width * piece.height / 1000000;
                            return area > prevThreshold && area <= threshold;
                          }).length;
                          
                          return (
                            <div key={size} className="flex justify-between">
                              <span>{size} ({'<' + threshold} m²):</span>
                              <span>{count} peças</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Peças */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tag</TableHead>
                          <TableHead>Dimensões (mm)</TableHead>
                          <TableHead>Área (m²)</TableHead>
                          <TableHead>Posição (X, Y)</TableHead>
                          <TableHead>Rotação</TableHead>
                          <TableHead>Peso (kg)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.sheets[selectedSheet].pieces.map((piece, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{piece.tag}</TableCell>
                            <TableCell>{piece.width} × {piece.height}</TableCell>
                            <TableCell>{(piece.width * piece.height / 1000000).toFixed(4)}</TableCell>
                            <TableCell>({piece.x.toFixed(1)}, {piece.y.toFixed(1)})</TableCell>
                            <TableCell>
                              {piece.rotation === 90 ? (
                                <Badge variant="secondary">90° ↻</Badge>
                              ) : (
                                <Badge variant="outline">0°</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {((piece.width * piece.height * project.thickness / 1000000) * 7.85).toFixed(3)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Produção */}
            <TabsContent value="production" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Instruções de Produção</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Parâmetros de Corte</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Processo:</span>
                          <span className="font-medium">{project.process.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kerf:</span>
                          <span className="font-medium">{project.kerf}mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Velocidade Est.:</span>
                          <span className="font-medium">
                            {project.process === 'plasma' ? '3000' : '1500'} mm/min
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Potência:</span>
                          <span className="font-medium">
                            {project.process === 'plasma' ? '85%' : '100%'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Controle de Qualidade</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" />
                          <span>Verificar dimensões da chapa</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" />
                          <span>Calibrar kerf do processo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" />
                          <span>Conferir posicionamento inicial</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" />
                          <span>Validar primeira peça cortada</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {optimizationMetrics && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2">Métricas de Otimização</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Algoritmo:</span>
                          <div className="font-medium">{optimizationMetrics.algorithm}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Tempo Otim.:</span>
                          <div className="font-medium">{optimizationMetrics.optimizationTime}ms</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Convergência:</span>
                          <div className="font-medium">
                            {optimizationMetrics.convergence ? '✓ Sim' : '✗ Não'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Iterações:</span>
                          <div className="font-medium">{optimizationMetrics.iterations || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assinaturas */}
              <Card>
                <CardHeader>
                  <CardTitle>Aprovações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center space-y-4">
                      <h4 className="font-medium">Operador</h4>
                      <div className="border-t-2 border-gray-300 pt-2">
                        <p className="font-medium">{project.operador}</p>
                        <p className="text-sm text-gray-600">{project.turno}º Turno</p>
                        <p className="text-xs text-gray-500">Data: ___/___/______</p>
                        <p className="text-xs text-gray-500 mt-4">Assinatura: _______________</p>
                      </div>
                    </div>

                    <div className="text-center space-y-4">
                      <h4 className="font-medium">Inspetor QA</h4>
                      <div className="border-t-2 border-gray-300 pt-2">
                        <p className="font-medium">{project.aprovadorQA || '_____________'}</p>
                        <p className="text-sm text-gray-600">Controle de Qualidade</p>
                        <p className="text-xs text-gray-500">Data: ___/___/______</p>
                        <p className="text-xs text-gray-500 mt-4">Assinatura: _______________</p>
                      </div>
                    </div>

                    <div className="text-center space-y-4">
                      <h4 className="font-medium">Supervisor</h4>
                      <div className="border-t-2 border-gray-300 pt-2">
                        <p className="font-medium">_____________</p>
                        <p className="text-sm text-gray-600">Supervisão</p>
                        <p className="text-xs text-gray-500">Data: ___/___/______</p>
                        <p className="text-xs text-gray-500 mt-4">Assinatura: _______________</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};
