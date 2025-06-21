
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  X, 
  Download, 
  Share2, 
  Printer, 
  FileText,
  BarChart3,
  TrendingUp,
  Package
} from 'lucide-react';

interface ReportViewerProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'material' | 'sheet' | 'linear' | 'efficiency';
  reportData: any;
  onDownload: () => void;
  onShare: () => void;
}

export const ReportViewer = ({
  isOpen,
  onClose,
  reportType,
  reportData,
  onDownload,
  onShare
}: ReportViewerProps) => {
  const [activeTab, setActiveTab] = useState('summary');

  const getReportIcon = () => {
    switch (reportType) {
      case 'material': return Package;
      case 'sheet': return FileText;
      case 'linear': return BarChart3;
      case 'efficiency': return TrendingUp;
      default: return FileText;
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'material': return 'Relatório de Materiais';
      case 'sheet': return 'Relatório de Chapas';
      case 'linear': return 'Relatório Linear';
      case 'efficiency': return 'Relatório de Eficiência';
      default: return 'Relatório';
    }
  };

  const ReportIcon = getReportIcon();

  const renderMaterialReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{reportData?.totalMaterials || 0}</div>
          <div className="text-sm text-gray-600">Total Materiais</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{reportData?.activeMaterials || 0}</div>
          <div className="text-sm text-gray-600">Ativos</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{reportData?.archivedMaterials || 0}</div>
          <div className="text-sm text-gray-600">Arquivados</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{reportData?.totalUsage || 0}</div>
          <div className="text-sm text-gray-600">Usos Totais</div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Último Uso</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportData?.materials?.map((material: any, index: number) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{material.name}</TableCell>
              <TableCell>{material.type}</TableCell>
              <TableCell>{material.count}</TableCell>
              <TableCell>{material.lastUsed}</TableCell>
              <TableCell>
                <Badge variant={material.status === 'active' ? 'default' : 'secondary'}>
                  {material.status === 'active' ? 'Ativo' : 'Arquivado'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderSheetReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{reportData?.totalSheets || 0}</div>
          <div className="text-sm text-gray-600">Total Chapas</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{reportData?.averageEfficiency?.toFixed(1) || 0}%</div>
          <div className="text-sm text-gray-600">Eficiência</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{reportData?.totalWeight?.toFixed(0) || 0} kg</div>
          <div className="text-sm text-gray-600">Peso Total</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">R$ {reportData?.materialCost?.toFixed(2) || 0}</div>
          <div className="text-sm text-gray-600">Custo</div>
        </div>
      </div>

      {reportData?.sheets && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chapa</TableHead>
              <TableHead>Eficiência</TableHead>
              <TableHead>Peças</TableHead>
              <TableHead>Área Útil</TableHead>
              <TableHead>Peso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.sheets.map((sheet: any, index: number) => (
              <TableRow key={index}>
                <TableCell className="font-medium">Chapa {index + 1}</TableCell>
                <TableCell>{sheet.efficiency?.toFixed(1)}%</TableCell>
                <TableCell>{sheet.pieces?.length || 0}</TableCell>
                <TableCell>{(sheet.utilizedArea / 1000000)?.toFixed(3)} m²</TableCell>
                <TableCell>{sheet.weight?.toFixed(2)} kg</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReportIcon className="w-5 h-5" />
            {getReportTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controles do Relatório */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Gerado em: {new Date().toLocaleDateString('pt-BR')}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Conteúdo do Relatório */}
          <div id="report-content">
            {reportType === 'material' && renderMaterialReport()}
            {reportType === 'sheet' && renderSheetReport()}
            {(reportType === 'linear' || reportType === 'efficiency') && (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Relatório em desenvolvimento</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
