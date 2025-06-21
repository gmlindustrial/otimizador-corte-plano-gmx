
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BarChart3, TrendingUp, Package } from 'lucide-react';
import { MaterialReportsManager } from '@/components/settings/MaterialReportsManager';
import { EfficiencyReport } from '@/components/dashboard/EfficiencyReport';
import { useToast } from '@/hooks/use-toast';

interface ReportsManagerProps {
  optimizationHistory: any[];
}

export const ReportsManager = ({ optimizationHistory }: ReportsManagerProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('materials');

  const handleExportReport = (type: string) => {
    toast({
      title: "Relatório Exportado",
      description: `Relatório ${type} foi exportado com sucesso`,
    });
  };

  const handleSendWhatsApp = (type: string) => {
    toast({
      title: "Enviado via WhatsApp",
      description: `Relatório ${type} foi enviado via WhatsApp`,
    });
  };

  const handleSendTelegram = (type: string) => {
    toast({
      title: "Enviado via Telegram",
      description: `Relatório ${type} foi enviado via Telegram`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Central de Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="materials" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Materiais
              </TabsTrigger>
              <TabsTrigger value="production" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Produção
              </TabsTrigger>
              <TabsTrigger value="efficiency" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Eficiência
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Gerenciais
              </TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="mt-6">
              <MaterialReportsManager />
            </TabsContent>

            <TabsContent value="production" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Relatórios de Produção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 border-dashed">
                      <h4 className="font-semibold mb-2">Otimizações por Período</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Relatório completo das otimizações realizadas por período
                      </p>
                      <div className="text-center text-gray-500">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Em desenvolvimento</p>
                      </div>
                    </Card>
                    
                    <Card className="p-4 border-dashed">
                      <h4 className="font-semibold mb-2">Consumo de Material</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Análise do consumo de materiais por projeto
                      </p>
                      <div className="text-center text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Em desenvolvimento</p>
                      </div>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="efficiency" className="mt-6">
              <EfficiencyReport
                history={optimizationHistory}
                timeFilter="all"
                onExport={handleExportReport}
                onSendWhatsApp={handleSendWhatsApp}
                onSendTelegram={handleSendTelegram}
              />
            </TabsContent>

            <TabsContent value="management" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Relatórios Gerenciais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 border-dashed">
                      <h4 className="font-semibold mb-2">Desempenho por Operador</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Análise de desempenho individual dos operadores
                      </p>
                      <div className="text-center text-gray-500">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Em desenvolvimento</p>
                      </div>
                    </Card>
                    
                    <Card className="p-4 border-dashed">
                      <h4 className="font-semibold mb-2">Custos e Economia</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Relatório de custos e economia gerada pela otimização
                      </p>
                      <div className="text-center text-gray-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Em desenvolvimento</p>
                      </div>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
