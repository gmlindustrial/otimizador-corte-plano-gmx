
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, BarChart3, Download, Send } from 'lucide-react';

interface EfficiencyReportProps {
  history: any[];
  timeFilter: string;
  onExport: (type: string) => void;
  onSendWhatsApp: (type: string) => void;
  onSendTelegram: (type: string) => void;
}

export const EfficiencyReport = ({ 
  history, 
  timeFilter, 
  onExport, 
  onSendWhatsApp, 
  onSendTelegram 
}: EfficiencyReportProps) => {
  
  const efficiencyData = history.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    efficiency: item.results.efficiency,
    waste: item.results.wastePercentage,
    operator: item.project?.operador || 'N/A',
    material: item.project?.tipoMaterial || 'N/A'
  }));

  const avgEfficiency = efficiencyData.length > 0 
    ? efficiencyData.reduce((sum, item) => sum + item.efficiency, 0) / efficiencyData.length 
    : 0;

  const avgWaste = efficiencyData.length > 0 
    ? efficiencyData.reduce((sum, item) => sum + item.waste, 0) / efficiencyData.length 
    : 0;

  const bestEfficiency = Math.max(...efficiencyData.map(item => item.efficiency), 0);
  const worstEfficiency = Math.min(...efficiencyData.map(item => item.efficiency), 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Relatório de Eficiência
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onExport('efficiency-report')}>
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSendWhatsApp('efficiency-report')}>
                <Send className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSendTelegram('efficiency-report')}>
                <Send className="w-4 h-4 mr-1" />
                Telegram
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{avgEfficiency.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Eficiência Média</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{bestEfficiency.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Melhor Resultado</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{worstEfficiency.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Pior Resultado</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{avgWaste.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Desperdício Médio</div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Histórico de Eficiência</h4>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left">Data</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Operador</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Material</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Eficiência</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Desperdício</th>
                  </tr>
                </thead>
                <tbody>
                  {efficiencyData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2">{item.date}</td>
                      <td className="border border-gray-300 px-3 py-2">{item.operator}</td>
                      <td className="border border-gray-300 px-3 py-2">{item.material}</td>
                      <td className="border border-gray-300 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Progress value={item.efficiency} className="flex-1 h-2" />
                          <span className="font-semibold">{item.efficiency.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-red-600">
                        {item.waste.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
