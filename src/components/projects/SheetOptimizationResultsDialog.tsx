import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  BarChart2,
  FileText,
  Download,
  X,
  Scissors,
  Square,
  CheckCircle,
} from 'lucide-react';
import type { SheetOptimizationResult, SheetProject } from '@/types/sheet';
import { SheetVisualization } from '@/components/sheet/SheetVisualization';
import { SheetOptimizationResults } from '@/components/sheet/SheetOptimizationResults';

interface SheetOptimizationResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: SheetOptimizationResult | null;
  project: SheetProject | null;
  optimizationName: string;
}

export const SheetOptimizationResultsDialog = ({
  open,
  onOpenChange,
  results,
  project,
  optimizationName,
}: SheetOptimizationResultsDialogProps) => {
  const [activeTab, setActiveTab] = useState<'visualization' | 'results' | 'report'>('visualization');

  if (!results || !project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full overflow-hidden flex flex-col">
        <DialogHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white -m-6 mb-4 p-6 rounded-t-lg">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scissors className="w-6 h-6" />
              <div>
                <div className="text-xl font-bold">{optimizationName}</div>
                <div className="text-sm text-teal-100 font-normal mt-1">
                  Resultado da Otimização de Chapas
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white hover:bg-white/30">
                  <Square className="w-3 h-3 mr-1" />
                  {results.totalSheets} Chapa(s)
                </Badge>
                <Badge className="bg-white/20 text-white hover:bg-white/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {results.averageEfficiency.toFixed(1)}% Eficiência
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg mb-4">
            <TabsTrigger
              value="visualization"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow"
            >
              <Eye className="w-4 h-4" />
              Mapa de Corte
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow"
            >
              <BarChart2 className="w-4 h-4" />
              Resultados
            </TabsTrigger>
            <TabsTrigger
              value="report"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow"
            >
              <FileText className="w-4 h-4" />
              Detalhamento
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="visualization" className="m-0 h-full">
              <SheetVisualization results={results} project={project} />
            </TabsContent>

            <TabsContent value="results" className="m-0">
              <SheetOptimizationResults results={results} project={project} />
            </TabsContent>

            <TabsContent value="report" className="m-0">
              <div className="space-y-6">
                {/* Resumo Geral */}
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
                  <h3 className="text-lg font-semibold text-teal-800 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" />
                    Resumo da Otimização
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-teal-600">{results.totalSheets}</div>
                      <div className="text-sm text-gray-600">Chapas Utilizadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {results.averageEfficiency.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Eficiência Média</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {results.totalWeight.toFixed(1)} kg
                      </div>
                      <div className="text-sm text-gray-600">Peso Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {(results.totalWasteArea / 1_000_000).toFixed(2)} m²
                      </div>
                      <div className="text-sm text-gray-600">Área Desperdiçada</div>
                    </div>
                  </div>
                </div>

                {/* Detalhes por Chapa */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Square className="w-5 h-5" />
                    Detalhamento por Chapa
                  </h3>
                  {results.sheets.map((sheet, index) => (
                    <div
                      key={sheet.id}
                      className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-4 border-b">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-800">Chapa {index + 1}</h4>
                          <Badge
                            variant={
                              sheet.efficiency > 80
                                ? 'default'
                                : sheet.efficiency > 60
                                ? 'secondary'
                                : 'destructive'
                            }
                            className={
                              sheet.efficiency > 80
                                ? 'bg-green-100 text-green-800'
                                : sheet.efficiency > 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {sheet.efficiency.toFixed(1)}% eficiente
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-600">Peças:</span>
                            <div className="font-semibold text-lg">{sheet.pieces.length}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Área Utilizada:</span>
                            <div className="font-semibold text-lg text-green-600">
                              {(sheet.utilizedArea / 1_000_000).toFixed(3)} m²
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Sobra:</span>
                            <div className="font-semibold text-lg text-orange-600">
                              {(sheet.wasteArea / 1_000_000).toFixed(3)} m²
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Peso:</span>
                            <div className="font-semibold text-lg">{sheet.weight.toFixed(2)} kg</div>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="text-sm text-gray-600 mb-2">
                            Peças nesta chapa ({sheet.pieces.length}):
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sheet.pieces.map((piece, pieceIndex) => (
                              <Badge
                                key={pieceIndex}
                                variant="outline"
                                className="text-xs py-1 px-2"
                              >
                                {piece.tag}
                                <span className="ml-1 text-gray-500">
                                  ({piece.width}×{piece.height}mm)
                                </span>
                                {piece.rotation === 90 && (
                                  <span className="ml-1 text-purple-600">↻</span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Informações do Projeto */}
                <div className="bg-gray-50 rounded-xl p-6 border">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações do Projeto</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Projeto:</span>
                      <div className="font-medium">
                        {project.name} ({project.projectNumber})
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Chapa Padrão:</span>
                      <div className="font-medium">
                        {project.sheetWidth} × {project.sheetHeight} mm
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Material:</span>
                      <div className="font-medium">
                        {project.material} - {project.thickness}mm
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Processo:</span>
                      <div className="font-medium">{project.process?.toUpperCase() || 'PLASMA'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Kerf:</span>
                      <div className="font-medium">{project.kerf} mm</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
