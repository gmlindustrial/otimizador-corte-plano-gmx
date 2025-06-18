
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Scissors, Target, Download, Send } from 'lucide-react';

interface OperationalKPIsProps {
  history: any[];
  timeFilter: string;
  operatorFilter: string;
  onExport: (type: string) => void;
  onSendWhatsApp: (type: string) => void;
  onSendTelegram: (type: string) => void;
}

export const OperationalKPIs = ({ 
  history, 
  timeFilter, 
  operatorFilter, 
  onExport, 
  onSendWhatsApp, 
  onSendTelegram 
}: OperationalKPIsProps) => {
  
  // Cálculos por operador/turno
  const operatorStats = history.reduce((acc, item) => {
    const operador = item.project?.operador || 'Não informado';
    const turno = item.project?.turno || '1';
    
    if (!acc[operador]) {
      acc[operador] = {
        cortadas: 0,
        pendentes: 0,
        tempoMedio: 0,
        eficiencia: 0,
        turnos: {}
      };
    }
    
    const totalPecas = item.pieces.reduce((sum: number, piece: any) => Number(sum) + Number(piece.quantity || 0), 0);
    acc[operador].cortadas = Number(acc[operador].cortadas) + Number(totalPecas);
    
    const currentEfficiency = Number(item.results?.efficiency || 0);
    const currentEficiencia = Number(acc[operador].eficiencia || 0);
    const previousCount = currentEficiencia === 0 ? 1 : 2;
    acc[operador].eficiencia = currentEficiencia === 0 
      ? currentEfficiency 
      : (currentEficiencia + currentEfficiency) / previousCount;
    
    if (!acc[operador].turnos[turno]) {
      acc[operador].turnos[turno] = { cortadas: 0, listas: 0 };
    }
    acc[operador].turnos[turno].cortadas = Number(acc[operador].turnos[turno].cortadas) + Number(totalPecas);
    acc[operador].turnos[turno].listas = Number(acc[operador].turnos[turno].listas) + 1;
    
    return acc;
  }, {} as Record<string, any>);

  const tempoMedioPorPeca = 2.5; // minutos (exemplo)
  const metaEficiencia = 85;

  const totalCortadas = Object.values(operatorStats).reduce((sum, op: any) => {
    return Number(sum) + Number(op.cortadas || 0);
  }, 0);

  const eficienciaGeral = Object.keys(operatorStats).length > 0 
    ? Object.values(operatorStats).reduce((sum, op: any) => {
        return Number(sum) + Number(op.eficiencia || 0);
      }, 0) / Object.keys(operatorStats).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Cortadas x Pendentes por Operador */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Cortadas × Pendentes por Operador/Turno
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onExport('operator-report')}>
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSendWhatsApp('operator-report')}>
                <Send className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSendTelegram('operator-report')}>
                <Send className="w-4 h-4 mr-1" />
                Telegram
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(operatorStats).map(([operador, stats]: [string, any]) => (
              <div key={operador} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-lg">{operador}</h4>
                  <Badge variant={Number(stats.eficiencia || 0) >= metaEficiencia ? "default" : "destructive"}>
                    {Number(stats.eficiencia || 0).toFixed(1)}% eficiência
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">{Number(stats.cortadas || 0)}</div>
                    <div className="text-sm text-gray-600">Cortadas</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">{Number(stats.pendentes || 0)}</div>
                    <div className="text-sm text-gray-600">Pendentes</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{tempoMedioPorPeca}min</div>
                    <div className="text-sm text-gray-600">Tempo/Peça</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">
                      {(Number(stats.cortadas || 0) * tempoMedioPorPeca / 60).toFixed(1)}h
                    </div>
                    <div className="text-sm text-gray-600">Previsão Total</div>
                  </div>
                </div>

                {/* Breakdown por Turno */}
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(stats.turnos).map(([turno, dados]: [string, any]) => (
                    <div key={turno} className="bg-gray-50 p-3 rounded text-center">
                      <div className="font-semibold">
                        {turno === 'Central' ? 'Central' : `${turno}º Turno`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {Number(dados.cortadas || 0)} peças | {Number(dados.listas || 0)} listas
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI de Eficiência Operacional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            KPI de Eficiência Operacional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tempo Médio por Peça</span>
                <span className="text-lg font-semibold">{tempoMedioPorPeca}min</span>
              </div>
              <Progress value={75} className="h-2" />
              <div className="text-xs text-gray-500">Meta: 2.0min por peça</div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Previsão Total</span>
                <span className="text-lg font-semibold">
                  {(Number(totalCortadas) * tempoMedioPorPeca / 60).toFixed(1)}h
                </span>
              </div>
              <Progress value={60} className="h-2" />
              <div className="text-xs text-gray-500">Capacidade: 8h por turno</div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Eficiência Geral</span>
                <span className="text-lg font-semibold">
                  {Number(eficienciaGeral).toFixed(1)}%
                </span>
              </div>
              <Progress value={82} className="h-2" />
              <div className="text-xs text-gray-500">Meta: {metaEficiencia}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
