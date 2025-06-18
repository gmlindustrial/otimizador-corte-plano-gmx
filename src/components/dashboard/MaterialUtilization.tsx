
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Package, TrendingDown, Download, Send } from 'lucide-react';

interface MaterialUtilizationProps {
  history: any[];
  timeFilter: string;
  onExport: (type: string) => void;
  onSendWhatsApp: (type: string) => void;
  onSendTelegram: (type: string) => void;
}

export const MaterialUtilization = ({ 
  history, 
  timeFilter, 
  onExport, 
  onSendWhatsApp, 
  onSendTelegram 
}: MaterialUtilizationProps) => {
  
  // Assumindo densidade do aço: 7.85 kg/m³ para perfis
  const materialDensity = 7.85; // kg por metro linear (aproximado)
  
  const materialStats = history.reduce((acc, item) => {
    const material = item.project?.tipoMaterial || 'Material não especificado';
    const totalUsedLength = Number(item.results.totalBars || 0) * Number(item.barLength || 0) - Number(item.results.totalWaste || 0);
    const totalWasteLength = Number(item.results.totalWaste || 0);
    const totalMaterialLength = Number(item.results.totalBars || 0) * Number(item.barLength || 0);
    
    if (!acc[material]) {
      acc[material] = {
        totalKgCortado: 0,
        totalKgDesperdicio: 0,
        aproveitamento: 0,
        listas: 0
      };
    }
    
    const kgCortado = (totalUsedLength / 1000) * materialDensity;
    const kgDesperdicio = (totalWasteLength / 1000) * materialDensity;
    
    acc[material].totalKgCortado += kgCortado;
    acc[material].totalKgDesperdicio += kgDesperdicio;
    acc[material].listas += 1;
    
    const totalKg = acc[material].totalKgCortado + acc[material].totalKgDesperdicio;
    acc[material].aproveitamento = totalKg > 0 ? (acc[material].totalKgCortado / totalKg) * 100 : 0;
    
    return acc;
  }, {} as Record<string, any>);

  const totalKgCortado = Object.values(materialStats).reduce((sum, mat: any) => {
    return sum + Number(mat.totalKgCortado || 0);
  }, 0);
  
  const totalKgDesperdicio = Object.values(materialStats).reduce((sum, mat: any) => {
    return sum + Number(mat.totalKgDesperdicio || 0);
  }, 0);
  
  const aproveitamentoGeral = totalKgCortado > 0 ? (totalKgCortado / (totalKgCortado + totalKgDesperdicio)) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Utilização de Material
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onExport('material-report')}>
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSendWhatsApp('material-report')}>
                <Send className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSendTelegram('material-report')}>
                <Send className="w-4 h-4 mr-1" />
                Telegram
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{totalKgCortado.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Kg Cortado</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{totalKgDesperdicio.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Kg Desperdício</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{aproveitamentoGeral.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Aproveitamento</div>
            </div>
          </div>

          {/* Aproveitamento Geral */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Aproveitamento Geral</h4>
              <span className="text-sm text-gray-600">Meta: 85%</span>
            </div>
            <Progress value={aproveitamentoGeral} className="h-3" />
          </div>

          {/* Detalhamento por Material */}
          <div className="space-y-4">
            <h4 className="font-semibold">Utilização por Tipo de Material</h4>
            <div className="space-y-3">
              {Object.entries(materialStats).map(([material, stats]: [string, any]) => (
                <div key={material} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">{material}</h5>
                    <span className="text-sm text-gray-600">{Number(stats.listas || 0)} listas processadas</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{Number(stats.totalKgCortado || 0).toFixed(1)}</div>
                      <div className="text-xs text-gray-600">Kg Cortado</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{Number(stats.totalKgDesperdicio || 0).toFixed(1)}</div>
                      <div className="text-xs text-gray-600">Kg Desperdício</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{Number(stats.aproveitamento || 0).toFixed(1)}%</div>
                      <div className="text-xs text-gray-600">Aproveitamento</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Aproveitamento</span>
                      <span>{Number(stats.aproveitamento || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={Number(stats.aproveitamento || 0)} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Análise de Desperdício */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-800">Análise de Desperdício</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-yellow-700">
                  <strong>Desperdício Total:</strong> {totalKgDesperdicio.toFixed(1)} kg
                </p>
                <p className="text-yellow-700">
                  <strong>Custo Estimado:</strong> R$ {(totalKgDesperdicio * 5.50).toFixed(2)} 
                  <span className="text-xs ml-1">(R$ 5,50/kg)</span>
                </p>
              </div>
              <div>
                <p className="text-yellow-700">
                  <strong>Potencial de Melhoria:</strong> {Math.max(0, 85 - aproveitamentoGeral).toFixed(1)}%
                </p>
                <p className="text-yellow-700">
                  <strong>Economia Possível:</strong> R$ {(Math.max(0, 85 - aproveitamentoGeral) / 100 * totalKgDesperdicio * 5.50).toFixed(2)}/mês
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
