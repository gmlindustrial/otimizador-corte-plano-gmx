
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Eye, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReportViewer } from '@/components/reports/ReportViewer';
import { ShareDialog } from '@/components/reports/ShareDialog';
import { PDFReportService } from '@/services/PDFReportService';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useMaterialPrices } from '@/hooks/useMaterialPrices';
import { supabase } from '@/integrations/supabase/client';

interface MaterialReport {
  id: string;
  name: string;
  type: 'bars' | 'sheets';
  count: number;
  lastUsed: string;
  status: 'active' | 'archived';
  price?: number;
  description?: string;
}

export const MaterialReportsManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('bars');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [barMaterials, setBarMaterials] = useState<MaterialReport[]>([]);
  const [sheetMaterials, setSheetMaterials] = useState<MaterialReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { materiais } = useSupabaseData();
  const { prices } = useMaterialPrices();

  useEffect(() => {
    const processRealMaterials = async () => {
      if (!materiais.length) return;
      
      setLoading(true);
      
      try {
        // Buscar último uso de cada material no histórico
        const { data: historyData } = await supabase
          .from('historico_otimizacoes')
          .select('created_at, projeto_id, projetos(material_id)')
          .order('created_at', { ascending: false });

        const materialUsage: Record<string, { count: number; lastUsed: string }> = {};
        
        // Processar histórico para calcular uso
        historyData?.forEach(entry => {
          const materialId = "N/A"; // entry.projetos?.material_id;
          if (materialId) {
            if (!materialUsage[materialId]) {
              materialUsage[materialId] = { count: 0, lastUsed: entry.created_at };
            }
            materialUsage[materialId].count += 1;
            // Manter a data mais recente
            if (new Date(entry.created_at) > new Date(materialUsage[materialId].lastUsed)) {
              materialUsage[materialId].lastUsed = entry.created_at;
            }
          }
        });

        // Processar materiais reais
        const bars: MaterialReport[] = [];
        const sheets: MaterialReport[] = [];
        
        materiais.forEach(material => {
          const usage = materialUsage[material.id] || { count: 0, lastUsed: material.created_at };
          const price = prices.find(p => p.material_id === material.id)?.price_per_kg || 0;
          
          // Determinar se é ativo ou arquivado (se não foi usado nos últimos 30 dias)
          const lastUsedDate = new Date(usage.lastUsed);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const status = lastUsedDate > thirtyDaysAgo ? 'active' : 'archived';
          
          const materialReport: MaterialReport = {
            id: material.id,
            name: `${material.tipo} - ${material.descricao || 'Sem descrição'}`,
            type: material.tipo.toLowerCase().includes('chapa') ? 'sheets' : 'bars',
            count: usage.count,
            lastUsed: new Date(usage.lastUsed).toLocaleDateString('pt-BR'),
            status,
            price,
            description: material.descricao
          };
          
          if (materialReport.type === 'sheets') {
            sheets.push(materialReport);
          } else {
            bars.push(materialReport);
          }
        });
        
        setBarMaterials(bars);
        setSheetMaterials(sheets);
      } catch (error) {
        console.error('Erro ao processar materiais:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar dados dos materiais",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    processRealMaterials();
  }, [materiais, prices, toast]);

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
        totalValue: currentMaterials.reduce((sum, m) => sum + (m.price || 0), 0),
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
        totalValue: materials.reduce((sum, m) => sum + (m.price || 0), 0),
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
      {loading ? (
        <div className="text-center py-8">
          <p>Carregando materiais...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum material encontrado</p>
        </div>
      ) : (
        materials.map((material) => (
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
                  {material.count} usos • Último uso: {material.lastUsed}
                  {material.price && material.price > 0 && (
                    <span className="ml-2">• R$ {material.price.toFixed(2)}/kg</span>
                  )}
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
        ))
      )}
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
