
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizationResult, Project } from '@/pages/Index';
import { BarChart, Download, Printer, FileSpreadsheet } from 'lucide-react';

interface OptimizationResultsProps {
  results: OptimizationResult;
  barLength: number;
  project: Project | null;
}

export const OptimizationResults = ({ results, barLength, project }: OptimizationResultsProps) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Implementar exportação PDF
    console.log('Export PDF');
  };

  const handleExportExcel = () => {
    // Implementar exportação Excel
    console.log('Export Excel');
  };

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

      {/* Visualização das Barras */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg">Plano de Corte Detalhado</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {results.bars.map((bar, index) => (
              <div key={bar.id} className="space-y-2">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>Barra {index + 1}</span>
                  <span className="text-gray-500">
                    Sobra: {bar.waste}mm ({((bar.waste / barLength) * 100).toFixed(1)}%)
                  </span>
                </div>
                
                {/* Visualização gráfica da barra */}
                <div className="h-12 bg-gray-200 rounded-lg overflow-hidden flex relative">
                  {bar.pieces.map((piece, pieceIndex) => {
                    const widthPercentage = (piece.length / barLength) * 100;
                    return (
                      <div
                        key={pieceIndex}
                        className="h-full flex items-center justify-center text-white text-xs font-medium relative group"
                        style={{
                          width: `${widthPercentage}%`,
                          backgroundColor: piece.color,
                          borderRight: pieceIndex < bar.pieces.length - 1 ? '2px solid #fff' : 'none'
                        }}
                      >
                        {piece.length > 200 && piece.label}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                          {piece.label}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Área de desperdício */}
                  {bar.waste > 0 && (
                    <div
                      className="h-full bg-red-300 flex items-center justify-center text-red-800 text-xs font-medium"
                      style={{ width: `${(bar.waste / barLength) * 100}%` }}
                    >
                      {bar.waste > 100 && `${bar.waste}mm`}
                    </div>
                  )}
                </div>
                
                {/* Lista de peças da barra */}
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  Peças: {bar.pieces.map(p => p.label).join(' + ')}
                  {bar.waste > 0 && ` + Sobra: ${bar.waste}mm`}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botões de Exportação */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Exportar Resultados</h4>
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={handlePrint} variant="outline" className="justify-start">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Plano
              </Button>
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
        </CardContent>
      </Card>
    </div>
  );
};
