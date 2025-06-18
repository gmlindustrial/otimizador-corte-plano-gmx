
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scissors, AlertTriangle, CheckCircle, Download, Send } from 'lucide-react';

interface BladeManagementProps {
  history: any[];
  onExport: (type: string) => void;
  onSendWhatsApp: (type: string) => void;
  onSendTelegram: (type: string) => void;
}

export const BladeManagement = ({ 
  history, 
  onExport, 
  onSendWhatsApp, 
  onSendTelegram 
}: BladeManagementProps) => {
  
  // Simulação de dados de lâmina
  const [bladeData] = useState({
    totalCuts: 1547,
    maxCuts: 2000,
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-01-25',
    condition: 'good', // good, warning, critical
    cutsSinceLastChange: 347
  });

  const cutsToday = history.reduce((sum, item) => {
    const totalPieces = item.pieces.reduce((pieceSum, piece) => pieceSum + piece.quantity, 0);
    return sum + totalPieces;
  }, 0);

  const bladeHealth = (bladeData.totalCuts / bladeData.maxCuts) * 100;
  const daysUntilMaintenance = Math.ceil((new Date(bladeData.nextMaintenance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'good': return 'Boa';
      case 'warning': return 'Atenção';
      case 'critical': return 'Crítica';
      default: return 'Desconhecida';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              Gestão de Lâmina
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onExport('blade-report')}>
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSendWhatsApp('blade-report')}>
                <Send className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSendTelegram('blade-report')}>
                <Send className="w-4 h-4 mr-1" />
                Telegram
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status da Lâmina */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{bladeData.totalCuts}</div>
              <div className="text-sm text-gray-600">Total de Cortes</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{cutsToday}</div>
              <div className="text-sm text-gray-600">Cortes Hoje</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{bladeData.cutsSinceLastChange}</div>
              <div className="text-sm text-gray-600">Desde Última Troca</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{daysUntilMaintenance}</div>
              <div className="text-sm text-gray-600">Dias p/ Manutenção</div>
            </div>
          </div>

          {/* Indicador de Saúde */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Indicador de Saúde da Lâmina</h4>
              <Badge className={getConditionColor(bladeData.condition)}>
                {getConditionText(bladeData.condition)}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Vida Útil</span>
                <span>{bladeData.totalCuts} / {bladeData.maxCuts} cortes</span>
              </div>
              <Progress value={bladeHealth} className="h-3" />
            </div>

            {bladeHealth > 80 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Atenção:</strong> Lâmina próxima do limite recomendado. Programar troca em breve.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Histórico de Cortes */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quantidade de Cortes por Lista</h4>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left">Data</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Lista</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Operador</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Cortes</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Vida Útil</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => {
                    const totalCuts = item.pieces.reduce((sum, piece) => sum + piece.quantity, 0);
                    const lifeUsed = ((bladeData.totalCuts - totalCuts * (history.length - index)) / bladeData.maxCuts) * 100;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          {item.project?.lista || 'N/A'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          {item.project?.operador || 'N/A'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 font-semibold">
                          {totalCuts}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Progress value={Math.max(0, lifeUsed)} className="flex-1 h-2" />
                            <span className="text-xs">{Math.max(0, lifeUsed).toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerta de Troca */}
          {bladeHealth > 90 && (
            <Alert className="border-red-200 bg-red-50 mt-6">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>CRÍTICO:</strong> Lâmina deve ser trocada imediatamente!
                  </div>
                  <Button size="sm" variant="destructive">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Registrar Troca
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
