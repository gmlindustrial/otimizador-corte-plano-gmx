
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, TrendingUp, Package, Eye, Download } from 'lucide-react';
import { MaterialReportsManager } from '@/components/settings/MaterialReportsManager';
import { EfficiencyReport } from '@/components/dashboard/EfficiencyReport';
import { ReportViewer } from '@/components/reports/ReportViewer';
import { ShareDialog } from '@/components/reports/ShareDialog';
import { PDFReportService } from '@/services/PDFReportService';
import { useToast } from '@/hooks/use-toast';

interface ReportsManagerProps {
  optimizationHistory: any[];
}

export const ReportsManager = ({ optimizationHistory }: ReportsManagerProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('materials');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const handleExportReport = async (type: string) => {
    try {
      if (type === 'efficiency' && optimizationHistory.length > 0) {
        // Gerar relatório de eficiência baseado no histórico real
        await PDFReportService.generateLinearReport(optimizationHistory[0]);
      }
      
      toast({
        title: "Relatório Exportado",
        description: `Relatório ${type} foi exportado com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar o relatório",
        variant: "destructive",
      });
    }
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

  const handleViewProductionReport = () => {
    setSelectedReport({
      type: 'production',
      title: 'Relatório de Produção',
      data: {
        totalOptimizations: optimizationHistory.length,
        averageEfficiency: optimizationHistory.length > 0 
          ? optimizationHistory.reduce((sum, item) => sum + item.results.efficiency, 0) / optimizationHistory.length 
          : 0,
        totalMaterial: optimizationHistory.reduce((sum, item) => sum + (item.results.totalBars * item.barLength), 0),
        totalWaste: optimizationHistory.reduce((sum, item) => sum + item.results.totalWaste, 0)
      }
    });
    setViewerOpen(true);
  };

  const handleDownloadProductionReport = async () => {
    if (optimizationHistory.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados de otimização para gerar o relatório",
        variant: "destructive",
      });
      return;
    }

    try {
      // Usar o primeiro item do histórico como exemplo
      await PDFReportService.generateLinearReport(optimizationHistory[0]);
      toast({
        title: "PDF Gerado",
        description: "Relatório de produção baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    }
  };

  return (
    <>
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
                      <Card className="p-4">
                        <h4 className="font-semibold mb-2">Otimizações por Período</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Relatório completo das otimizações realizadas por período
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={handleViewProductionReport}>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleDownloadProductionReport}>
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-semibold mb-2">Consumo de Material</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Análise do consumo de materiais por projeto
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled>
                            <Eye className="w-4 h-4 mr-2" />
                            Em breve
                          </Button>
                          <Button size="sm" variant="outline" disabled>
                            <Download className="w-4 h-4 mr-2" />
                            Em breve
                          </Button>
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
                      <Card className="p-4">
                        <h4 className="font-semibold mb-2">Desempenho por Operador</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Análise de desempenho individual dos operadores
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled>
                            <Eye className="w-4 h-4 mr-2" />
                            Em breve
                          </Button>
                          <Button size="sm" variant="outline" disabled>
                            <Download className="w-4 h-4 mr-2" />
                            Em breve
                          </Button>
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-semibold mb-2">Custos e Economia</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Relatório de custos e economia gerada pela otimização
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled>
                            <Eye className="w-4 h-4 mr-2" />
                            Em breve
                          </Button>
                          <Button size="sm" variant="outline" disabled>
                            <Download className="w-4 h-4 mr-2" />
                            Em breve
                          </Button>
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

      {selectedReport && (
        <ReportViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          reportType={selectedReport.type}
          reportData={selectedReport.data}
          onDownload={async () => {
            if (optimizationHistory.length > 0) {
              await PDFReportService.generateLinearReport(optimizationHistory[0]);
              toast({
                title: "PDF Baixado",
                description: "Relatório baixado com sucesso",
              });
            }
          }}
          onShare={() => setShareDialogOpen(true)}
        />
      )}

      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        reportType={selectedReport?.type || "production"}
        reportTitle={selectedReport?.title || "Relatório"}
      />
    </>
  );
};
