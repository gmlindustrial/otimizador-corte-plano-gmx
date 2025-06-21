
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Eye, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReportViewer } from '@/components/reports/ReportViewer';
import { ShareDialog } from '@/components/reports/ShareDialog';
import { PDFReportService } from '@/services/PDFReportService';

interface MaterialReport {
  id: string;
  name: string;
  type: 'bars' | 'sheets';
  count: number;
  lastUsed: string;
  status: 'active' | 'archived';
}

export const MaterialReportsManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('bars');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Mock data - em produção viria do Supabase
  const barMaterials: MaterialReport[] = [
    { id: '1', name: 'Barra Aço A36 - 12mm', type: 'bars', count: 150, lastUsed: '2024-06-20', status: 'active' },
    { id: '2', name: 'Barra Aço A572 - 16mm', type: 'bars', count: 80, lastUsed: '2024-06-19', status: 'active' },
    { id: '3', name: 'Barra Inox 304 - 10mm', type: 'bars', count: 25, lastUsed: '2024-06-15', status: 'archived' },
  ];

  const sheetMaterials: MaterialReport[] = [
    { id: '4', name: 'Chapa Aço A36 - 6mm', type: 'sheets', count: 45, lastUsed: '2024-06-21', status: 'active' },
    { id: '5', name: 'Chapa Aço A572 - 12mm', type: 'sheets', count: 32, lastUsed: '2024-06-20', status: 'active' },
    { id: '6', name: 'Chapa Inox 316 - 8mm', type: 'sheets', count: 18, lastUsed: '2024-06-18', status: 'active' },
  ];

  const handleViewReport = (material: MaterialReport) => {
    const currentMaterials = activeTab === 'bars' ? barMaterials : sheetMaterials;
    setSelectedReport({
      type: 'material',
      title: `Relatório de ${material.name}`,
      data: {
        totalMaterials: currentMaterials.length,
        activeMaterials: currentMaterials.filter(m => m.status === 'active').length,
        archivedMaterials: currentMaterials.filter(m => m.status === 'archived').length,
        totalUsage: currentMaterials.reduce((sum, m) => sum + m.count, 0),
        materials: currentMaterials
      }
    });
    setViewerOpen(true);
  };

  const handleDownloadReport = async (material: MaterialReport) => {
    try {
      const currentMaterials = activeTab === 'bars' ? barMaterials : sheetMaterials;
      await PDFReportService.generateMaterialReport(currentMaterials);
      
      toast({
        title: "PDF Gerado",
        description: `Relatório de ${material.name} baixado com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    }
  };

  const handleGenerateFullReport = async (type: 'bars' | 'sheets') => {
    try {
      const materials = type === 'bars' ? barMaterials : sheetMaterials;
      await PDFReportService.generateMaterialReport(materials);
      
      toast({
        title: "Relatório Completo Gerado",
        description: `Relatório completo de ${type === 'bars' ? 'barras' : 'chapas'} baixado com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório completo",
        variant: "destructive",
      });
    }
  };

  const handleViewFullReport = (type: 'bars' | 'sheets') => {
    const materials = type === 'bars' ? barMaterials : sheetMaterials;
    setSelectedReport({
      type: 'material',
      title: `Relatório Completo - ${type === 'bars' ? 'Barras' : 'Chapas'}`,
      data: {
        totalMaterials: materials.length,
        activeMaterials: materials.filter(m => m.status === 'active').length,
        archivedMaterials: materials.filter(m => m.status === 'archived').length,
        totalUsage: materials.reduce((sum, m) => sum + m.count, 0),
        materials: materials
      }
    });
    setViewerOpen(true);
  };

  const handleShareReport = () => {
    setShareDialogOpen(true);
  };

  const MaterialList = ({ materials }: { materials: MaterialReport[] }) => (
    <div className="space-y-4">
      {materials.map((material) => (
        <Card key={material.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="font-medium text-gray-900">{material.name}</h4>
                <Badge variant={material.status === 'active' ? 'default' : 'secondary'}>
                  {material.status === 'active' ? 'Ativo' : 'Arquivado'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {material.count} unidades • Último uso: {material.lastUsed}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewReport(material)}
              >
                <Eye className="w-4 h-4" />
                Ver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownloadReport(material)}
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatórios de Materiais Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bars">Barras ({barMaterials.length})</TabsTrigger>
              <TabsTrigger value="sheets">Chapas ({sheetMaterials.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="bars" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Materiais em Barras</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewFullReport('bars')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateFullReport('bars')}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Relatório PDF
                  </Button>
                </div>
              </div>
              <MaterialList materials={barMaterials} />
            </TabsContent>

            <TabsContent value="sheets" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Materiais em Chapas</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewFullReport('sheets')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateFullReport('sheets')}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Relatório PDF
                  </Button>
                </div>
              </div>
              <MaterialList materials={sheetMaterials} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedReport && (
        <ReportViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          reportType={selectedReport.type}
          reportData={selectedReport.data}
          onDownload={async () => {
            try {
              await PDFReportService.generateMaterialReport(selectedReport.data.materials);
              toast({
                title: "PDF Baixado",
                description: "Relatório baixado com sucesso",
              });
            } catch (error) {
              toast({
                title: "Erro",
                description: "Não foi possível baixar o relatório",
                variant: "destructive",
              });
            }
          }}
          onShare={handleShareReport}
        />
      )}

      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        reportType="material"
        reportTitle={selectedReport?.title || "Relatório de Materiais"}
      />
    </>
  );
};
