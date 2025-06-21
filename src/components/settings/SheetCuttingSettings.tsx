
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Square, Save, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SheetCuttingConfig {
  defaultKerf: number;
  defaultSheetWidth: number;
  defaultSheetHeight: number;
  enableEdgeRounding: boolean;
  defaultRadius: number;
  plasmaKerf: number;
  oxicorteKerf: number;
  algorithm: 'BLF' | 'Genetic' | 'MultiObjective';
}

export const SheetCuttingSettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<SheetCuttingConfig>({
    defaultKerf: 6, // Alterado de 2mm para 6mm
    defaultSheetWidth: 2550,
    defaultSheetHeight: 6000,
    enableEdgeRounding: false,
    defaultRadius: 2,
    plasmaKerf: 6,
    oxicorteKerf: 6,
    algorithm: 'MultiObjective'
  });

  const handleSave = () => {
    // Salvar configurações no localStorage ou Supabase
    localStorage.setItem('sheetCuttingConfig', JSON.stringify(config));
    toast({
      title: "Configurações Salvas",
      description: "Configurações de corte de chapas foram atualizadas com sucesso.",
    });
  };

  const generateReport = () => {
    toast({
      title: "Relatório Gerado",
      description: "Abrindo relatório de materiais cadastrados...",
    });
    // Implementar geração de relatório
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Square className="w-5 h-5" />
          Configurações de Corte de Chapas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Configurações de Corte</h3>
            
            <div className="space-y-2">
              <Label htmlFor="defaultKerf">Kerf Padrão (mm)</Label>
              <Input
                id="defaultKerf"
                type="number"
                value={config.defaultKerf}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultKerf: parseFloat(e.target.value) }))}
                min={0}
                step={0.1}
              />
              <p className="text-xs text-gray-500">Largura do corte plasma/oxicorte</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plasmaKerf">Kerf Plasma (mm)</Label>
                <Input
                  id="plasmaKerf"
                  type="number"
                  value={config.plasmaKerf}
                  onChange={(e) => setConfig(prev => ({ ...prev, plasmaKerf: parseFloat(e.target.value) }))}
                  min={0}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oxicorteKerf">Kerf Oxicorte (mm)</Label>
                <Input
                  id="oxicorteKerf"
                  type="number"
                  value={config.oxicorteKerf}
                  onChange={(e) => setConfig(prev => ({ ...prev, oxicorteKerf: parseFloat(e.target.value) }))}
                  min={0}
                  step={0.1}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Dimensões Padrão</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sheetWidth">Largura (mm)</Label>
                <Input
                  id="sheetWidth"
                  type="number"
                  value={config.defaultSheetWidth}
                  onChange={(e) => setConfig(prev => ({ ...prev, defaultSheetWidth: parseInt(e.target.value) }))}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheetHeight">Altura (mm)</Label>
                <Input
                  id="sheetHeight"
                  type="number"
                  value={config.defaultSheetHeight}
                  onChange={(e) => setConfig(prev => ({ ...prev, defaultSheetHeight: parseInt(e.target.value) }))}
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Arredondamento de Bordas</h3>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enableRounding"
              checked={config.enableEdgeRounding}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableEdgeRounding: checked }))}
            />
            <Label htmlFor="enableRounding">Habilitar arredondamento de bordas das chapas</Label>
          </div>

          {config.enableEdgeRounding && (
            <div className="space-y-2">
              <Label htmlFor="roundingRadius">Raio de Arredondamento (mm)</Label>
              <Input
                id="roundingRadius"
                type="number"
                value={config.defaultRadius}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultRadius: parseFloat(e.target.value) }))}
                min={0}
                step={0.1}
                className="max-w-32"
              />
              <p className="text-xs text-gray-500">Raio aplicado aos cantos das chapas durante o corte</p>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <Button 
            onClick={generateReport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Relatório de Materiais
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
