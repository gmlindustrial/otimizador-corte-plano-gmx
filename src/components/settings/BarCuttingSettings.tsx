
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calculator, Save, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarCuttingConfig {
  defaultBarLength: number;
  cutLoss: number;
  algorithm: 'FFD' | 'BFD' | 'NextFit';
  allowWaste: boolean;
  maxWastePercentage: number;
  minPieceLength: number;
}

export const BarCuttingSettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<BarCuttingConfig>({
    defaultBarLength: 6000,
    cutLoss: 3,
    algorithm: 'FFD',
    allowWaste: true,
    maxWastePercentage: 15,
    minPieceLength: 50
  });

  const handleSave = () => {
    localStorage.setItem('barCuttingConfig', JSON.stringify(config));
    toast({
      title: "Configurações Salvas",
      description: "Configurações de corte linear foram atualizadas com sucesso.",
    });
  };

  const generateReport = () => {
    toast({
      title: "Relatório Gerado",
      description: "Abrindo relatório de barras cadastradas...",
    });
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Configurações de Corte Linear (Barras)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Configurações de Corte</h3>
            
            <div className="space-y-2">
              <Label htmlFor="barLength">Comprimento Padrão de Barras (mm)</Label>
              <Input
                id="barLength"
                type="number"
                value={config.defaultBarLength}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultBarLength: parseInt(e.target.value) }))}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cutLoss">Perda por Corte (mm)</Label>
              <Input
                id="cutLoss"
                type="number"
                value={config.cutLoss}
                onChange={(e) => setConfig(prev => ({ ...prev, cutLoss: parseFloat(e.target.value) }))}
                min={0}
                step={0.1}
              />
              <p className="text-xs text-gray-500">Material perdido a cada corte realizado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPieceLength">Comprimento Mínimo da Peça (mm)</Label>
              <Input
                id="minPieceLength"
                type="number"
                value={config.minPieceLength}
                onChange={(e) => setConfig(prev => ({ ...prev, minPieceLength: parseInt(e.target.value) }))}
                min={0}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Algoritmo de Otimização</h3>
            
            <div className="space-y-2">
              <Label htmlFor="algorithm">Algoritmo</Label>
              <Select value={config.algorithm} onValueChange={(value: 'FFD' | 'BFD' | 'NextFit') => setConfig(prev => ({ ...prev, algorithm: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FFD">First Fit Decreasing (FFD)</SelectItem>
                  <SelectItem value="BFD">Best Fit Decreasing (BFD)</SelectItem>
                  <SelectItem value="NextFit">Next Fit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxWaste">Desperdício Máximo Permitido (%)</Label>
              <Input
                id="maxWaste"
                type="number"
                value={config.maxWastePercentage}
                onChange={(e) => setConfig(prev => ({ ...prev, maxWastePercentage: parseFloat(e.target.value) }))}
                min={0}
                max={100}
                step={0.1}
              />
              <p className="text-xs text-gray-500">Percentual máximo de desperdício aceitável</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Informações do Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium">Algoritmo Atual:</p>
              <p>{config.algorithm === 'FFD' ? 'First Fit Decreasing' : config.algorithm === 'BFD' ? 'Best Fit Decreasing' : 'Next Fit'}</p>
            </div>
            <div>
              <p className="font-medium">Perda por Corte:</p>
              <p>{config.cutLoss}mm</p>
            </div>
            <div>
              <p className="font-medium">Comprimento Padrão:</p>
              <p>{config.defaultBarLength}mm</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <Button 
            onClick={generateReport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Relatório de Barras
          </Button>
          
          <Button 
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
