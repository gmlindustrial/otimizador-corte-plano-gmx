
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Clock, Users, Scissors, AlertTriangle, TrendingUp, Download, Send } from 'lucide-react';
import { OperationalKPIs } from './dashboard/OperationalKPIs';
import { EfficiencyReport } from './dashboard/EfficiencyReport';
import { BladeManagement } from './dashboard/BladeManagement';
import { MaterialUtilization } from './dashboard/MaterialUtilization';
import { DuplicityMonitor } from './dashboard/DuplicityMonitor';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface DashboardProps {
  history: Array<{
    id: string;
    project: any;
    pieces: any[];
    results: any;
    date: string;
    barLength: number;
  }>;
}

export const Dashboard = ({ history }: DashboardProps) => {
  const [timeFilter, setTimeFilter] = useState('today');
  const [operatorFilter, setOperatorFilter] = useState('all');
  
  const { operadores, loading: loadingOperadores } = useSupabaseData();
  const { settings } = useSystemSettings();
  
  // Cálculos de KPIs baseados no histórico
  const todayHistory = history.filter(item => {
    const itemDate = new Date(item.date);
    const today = new Date();
    return itemDate.toDateString() === today.toDateString();
  });

  const totalPiecesToday = todayHistory.reduce((sum, item) => 
    sum + item.pieces.reduce((pieceSum, piece) => pieceSum + piece.quantity, 0), 0);
  
  const totalBarsToday = todayHistory.reduce((sum, item) => sum + (item.results?.totalBars || 0), 0);
  
  const avgEfficiency = todayHistory.length > 0 
    ? todayHistory.reduce((sum, item) => sum + (item.results?.efficiency || 0), 0) / todayHistory.length 
    : 0;

  // Cálculo de tempo estimado baseado nas configurações
  const tempoMedioPorPeca = parseFloat(settings.tempo_medio_por_peca || '2.5');
  const tempoEstimadoHoras = (totalPiecesToday * tempoMedioPorPeca) / 60;

  const handleExportReport = (reportType: string) => {
    console.log(`Exportando relatório: ${reportType}`);
  };

  const handleSendWhatsApp = (reportType: string) => {
    console.log(`Enviando via WhatsApp: ${reportType}`);
  };

  const handleSendTelegram = (reportType: string) => {
    console.log(`Enviando via Telegram: ${reportType}`);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Dashboard Operacional - Optimizador Corte Plano GMX
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
              </SelectContent>
            </Select>

            <Select value={operatorFilter} onValueChange={setOperatorFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os Operadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Operadores</SelectItem>
                {operadores.map(op => (
                  <SelectItem key={op.id} value={op.nome}>{op.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Peças Cortadas Hoje</p>
                <p className="text-2xl font-bold text-green-600">{totalPiecesToday}</p>
                <p className="text-xs text-gray-500">~{tempoEstimadoHoras.toFixed(1)}h estimadas</p>
              </div>
              <Scissors className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Barras Utilizadas</p>
                <p className="text-2xl font-bold text-blue-600">{totalBarsToday}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eficiência Média</p>
                <p className="text-2xl font-bold text-orange-600">{avgEfficiency.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  Meta: {settings.meta_eficiencia || '85'}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Listas Processadas</p>
                <p className="text-2xl font-bold text-purple-600">{todayHistory.length}</p>
                <p className="text-xs text-gray-500">
                  {operadores.length} operadores ativos
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs defaultValue="operational" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="operational">KPIs Operacionais</TabsTrigger>
          <TabsTrigger value="efficiency">Eficiência</TabsTrigger>
          <TabsTrigger value="blade">Gestão Lâmina</TabsTrigger>
          <TabsTrigger value="material">Material</TabsTrigger>
          <TabsTrigger value="duplicity">Duplicidade</TabsTrigger>
        </TabsList>

        <TabsContent value="operational">
          <OperationalKPIs 
            history={history} 
            timeFilter={timeFilter}
            operatorFilter={operatorFilter}
            onExport={handleExportReport}
            onSendWhatsApp={handleSendWhatsApp}
            onSendTelegram={handleSendTelegram}
          />
        </TabsContent>

        <TabsContent value="efficiency">
          <EfficiencyReport 
            history={history}
            timeFilter={timeFilter}
            onExport={handleExportReport}
            onSendWhatsApp={handleSendWhatsApp}
            onSendTelegram={handleSendTelegram}
          />
        </TabsContent>

        <TabsContent value="blade">
          <BladeManagement 
            history={history}
            onExport={handleExportReport}
            onSendWhatsApp={handleSendWhatsApp}
            onSendTelegram={handleSendTelegram}
          />
        </TabsContent>

        <TabsContent value="material">
          <MaterialUtilization 
            history={history}
            timeFilter={timeFilter}
            onExport={handleExportReport}
            onSendWhatsApp={handleSendWhatsApp}
            onSendTelegram={handleSendTelegram}
          />
        </TabsContent>

        <TabsContent value="duplicity">
          <DuplicityMonitor 
            history={history}
            onExport={handleExportReport}
            onSendWhatsApp={handleSendWhatsApp}
            onSendTelegram={handleSendTelegram}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
