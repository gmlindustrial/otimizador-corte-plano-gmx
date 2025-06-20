
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SheetOptimizationResult, SheetProject } from '@/types/sheet';
import { Square, FileText, Weight, DollarSign } from 'lucide-react';

interface SheetOptimizationResultsProps {
  results: SheetOptimizationResult;
  project: SheetProject | null;
}

export const SheetOptimizationResults = ({ results, project }: SheetOptimizationResultsProps) => {
  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Square className="w-5 h-5" />
            Resultado da Otimização
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{results.totalSheets}</div>
              <div className="text-sm text-gray-600">Chapas Utilizadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{results.averageEfficiency.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Eficiência Média</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Eficiência:</span>
              <span className="font-medium">{results.averageEfficiency.toFixed(1)}%</span>
            </div>
            <Progress value={results.averageEfficiency} className="h-2" />
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <Weight className="w-4 h-4" />
                Peso Total:
              </span>
              <span className="font-medium">{results.totalWeight.toFixed(2)} kg</span>
            </div>
            
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Custo Material:
              </span>
              <span className="font-medium">R$ {results.materialCost.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Área Desperdiçada:</span>
              <span className="font-medium">{(results.totalWasteArea / 1000000).toFixed(2)} m²</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes por Chapa */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detalhamento por Chapa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {results.sheets.map((sheet, index) => (
              <div key={sheet.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Chapa {index + 1}</h4>
                  <Badge variant={sheet.efficiency > 80 ? "default" : sheet.efficiency > 60 ? "secondary" : "destructive"}>
                    {sheet.efficiency.toFixed(1)}% eficiente
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Peças:</span>
                    <div className="font-medium">{sheet.pieces.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Área Utilizada:</span>
                    <div className="font-medium">{(sheet.utilizedArea / 1000000).toFixed(2)} m²</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Sobra:</span>
                    <div className="font-medium">{(sheet.wasteArea / 1000000).toFixed(2)} m²</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Peso:</span>
                    <div className="font-medium">{sheet.weight.toFixed(2)} kg</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-2">Peças na chapa:</div>
                  <div className="flex flex-wrap gap-1">
                    {sheet.pieces.map((piece, pieceIndex) => (
                      <Badge key={pieceIndex} variant="outline" className="text-xs">
                        {piece.tag} ({piece.width}x{piece.height}
                        {piece.rotation === 90 ? ' ↻' : ''})
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informações do Projeto */}
      {project && (
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle>Informações do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Projeto:</span>
                <div className="font-medium">{project.name} ({project.projectNumber})</div>
              </div>
              <div>
                <span className="text-gray-600">Cliente:</span>
                <div className="font-medium">{project.client}</div>
              </div>
              <div>
                <span className="text-gray-600">Chapa Padrão:</span>
                <div className="font-medium">{project.sheetWidth}x{project.sheetHeight}mm</div>
              </div>
              <div>
                <span className="text-gray-600">Material:</span>
                <div className="font-medium">{project.material} - {project.thickness}mm</div>
              </div>
              <div>
                <span className="text-gray-600">Processo:</span>
                <div className="font-medium">{project.process.toUpperCase()}</div>
              </div>
              <div>
                <span className="text-gray-600">Operador:</span>
                <div className="font-medium">{project.operador}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
