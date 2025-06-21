
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, Target, Clock, AlertTriangle } from 'lucide-react';

interface AdvancedSettingsProps {
  sheetWidth: number;
  sheetHeight: number;
  thickness: number;
  kerf: number;
  process: 'plasma' | 'oxicorte' | 'both';
  material: string;
  onSheetWidthChange: (value: number) => void;
  onSheetHeightChange: (value: number) => void;
  onThicknessChange: (value: number) => void;
  onKerfChange: (value: number) => void;
  onProcessChange: (value: 'plasma' | 'oxicorte' | 'both') => void;
  onMaterialChange: (value: string) => void;
  optimizationSettings: {
    algorithm: 'BLF' | 'Genetic' | 'MultiObjective';
    maxGenerations: number;
    populationSize: number;
    mutationRate: number;
    enableNesting: boolean;
    priorityMode: 'efficiency' | 'speed' | 'balanced';
    timeLimit: number;
  };
  onOptimizationSettingsChange: (settings: any) => void;
}

export const AdvancedSettings = ({
  sheetWidth,
  sheetHeight,
  thickness,
  kerf,
  process,
  material,
  onSheetWidthChange,
  onSheetHeightChange,
  onThicknessChange,
  onKerfChange,
  onProcessChange,
  onMaterialChange,
  optimizationSettings,
  onOptimizationSettingsChange
}: AdvancedSettingsProps) => {
  const materialOptions = [
    { value: 'A36', label: 'A36 - Aço Carbono', density: 7.85 },
    { value: 'A572', label: 'A572 - Alta Resistência', density: 7.85 },
    { value: 'A514', label: 'A514 - Liga Temperado', density: 7.85 },
    { value: 'SAE1020', label: 'SAE 1020 - Aço Doce', density: 7.87 },
    { value: 'INOX304', label: 'INOX 304 - Inoxidável', density: 8.00 },
    { value: 'INOX316', label: 'INOX 316 - Marinho', density: 8.03 },
    { value: 'AL6061', label: 'Alumínio 6061', density: 2.70 },
    { value: 'AL5052', label: 'Alumínio 5052', density: 2.68 }
  ];

  const sheetSizes = [
    { width: 1500, height: 3000, label: '1,5m × 3,0m' },
    { width: 2000, height: 4000, label: '2,0m × 4,0m' },
    { width: 2500, height: 6000, label: '2,5m × 6,0m' },
    { width: 3000, height: 6000, label: '3,0m × 6,0m' },
    { width: 2550, height: 6000, label: '2,55m × 6,0m (Padrão)' }
  ];

  const handlePresetSize = (width: number, height: number) => {
    onSheetWidthChange(width);
    onSheetHeightChange(height);
  };

  const handleAlgorithmChange = (algorithm: 'BLF' | 'Genetic' | 'MultiObjective') => {
    onOptimizationSettingsChange({
      ...optimizationSettings,
      algorithm
    });
  };

  const handlePriorityChange = (priorityMode: 'efficiency' | 'speed' | 'balanced') => {
    const presets = {
      efficiency: { maxGenerations: 500, populationSize: 100, mutationRate: 0.1, timeLimit: 300 },
      speed: { maxGenerations: 100, populationSize: 50, mutationRate: 0.2, timeLimit: 60 },
      balanced: { maxGenerations: 250, populationSize: 75, mutationRate: 0.15, timeLimit: 120 }
    };

    onOptimizationSettingsChange({
      ...optimizationSettings,
      priorityMode,
      ...presets[priorityMode]
    });
  };

  const selectedMaterial = materialOptions.find(m => m.value === material);
  const estimatedWeight = selectedMaterial 
    ? (sheetWidth * sheetHeight * thickness * selectedMaterial.density / 1000000000).toFixed(2)
    : '0';

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurações Avançadas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        {/* Configurações da Chapa */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Especificações da Chapa
          </h3>

          {/* Tamanhos Pré-definidos */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tamanhos Padrão</Label>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              {sheetSizes.map((size) => (
                <Button
                  key={`${size.width}x${size.height}`}
                  variant={sheetWidth === size.width && sheetHeight === size.height ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetSize(size.width, size.height)}
                  className="text-xs"
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Dimensões Customizadas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sheetWidth">Largura (mm)</Label>
              <Input
                id="sheetWidth"
                type="number"
                value={sheetWidth}
                onChange={(e) => onSheetWidthChange(parseFloat(e.target.value) || 0)}
                min="500"
                max="5000"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheetHeight">Comprimento (mm)</Label>
              <Input
                id="sheetHeight"
                type="number"
                value={sheetHeight}
                onChange={(e) => onSheetHeightChange(parseFloat(e.target.value) || 0)}
                min="1000"
                max="12000"
                className="h-10"
              />
            </div>
          </div>

          {/* Material e Espessura */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Material</Label>
              <Select value={material} onValueChange={onMaterialChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione o material" />
                </SelectTrigger>
                <SelectContent>
                  {materialOptions.map((mat) => (
                    <SelectItem key={mat.value} value={mat.value}>
                      {mat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thickness">Espessura (mm)</Label>
              <Input
                id="thickness"
                type="number"
                value={thickness}
                onChange={(e) => onThicknessChange(parseFloat(e.target.value) || 0)}
                min="1"
                max="100"
                step="0.5"
                className="h-10"
              />
            </div>
          </div>

          {/* Processo de Corte */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Processo de Corte</Label>
              <Select value={process} onValueChange={onProcessChange}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plasma">Plasma</SelectItem>
                  <SelectItem value="oxicorte">Oxicorte</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kerf">Largura do Corte (mm)</Label>
              <Input
                id="kerf"
                type="number"
                value={kerf}
                onChange={(e) => onKerfChange(parseFloat(e.target.value) || 0)}
                min="0.5"
                max="10"
                step="0.1"
                className="h-10"
              />
            </div>
          </div>

          {/* Informações Calculadas */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Área da Chapa:</span>
                <div className="font-medium">{((sheetWidth * sheetHeight) / 1000000).toFixed(2)} m²</div>
              </div>
              <div>
                <span className="text-gray-600">Peso Estimado:</span>
                <div className="font-medium">{estimatedWeight} kg</div>
              </div>
              <div>
                <span className="text-gray-600">Densidade:</span>
                <div className="font-medium">{selectedMaterial?.density || 0} kg/dm³</div>
              </div>
            </div>
          </div>
        </div>

        {/* Configurações de Otimização */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Algoritmos de Otimização
          </h3>

          {/* Algoritmo Principal */}
          <div className="space-y-2">
            <Label>Algoritmo Principal</Label>
            <Select value={optimizationSettings.algorithm} onValueChange={handleAlgorithmChange}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MultiObjective">Multi-Objetivo (Recomendado)</SelectItem>
                <SelectItem value="Genetic">Algoritmo Genético</SelectItem>
                <SelectItem value="BLF">Bottom-Left Fill</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Modo de Prioridade */}
          <div className="space-y-2">
            <Label>Modo de Prioridade</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'efficiency', label: 'Eficiência', icon: Target },
                { value: 'speed', label: 'Velocidade', icon: Zap },
                { value: 'balanced', label: 'Balanceado', icon: Settings }
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={optimizationSettings.priorityMode === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePriorityChange(value as any)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Configurações Avançadas do Algoritmo Genético */}
          {optimizationSettings.algorithm === 'Genetic' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900">Parâmetros do Algoritmo Genético</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gerações Máximas: {optimizationSettings.maxGenerations}</Label>
                  <Slider
                    value={[optimizationSettings.maxGenerations]}
                    onValueChange={([value]) => onOptimizationSettingsChange({
                      ...optimizationSettings,
                      maxGenerations: value
                    })}
                    min={50}
                    max={1000}
                    step={50}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tamanho da População: {optimizationSettings.populationSize}</Label>
                  <Slider
                    value={[optimizationSettings.populationSize]}
                    onValueChange={([value]) => onOptimizationSettingsChange({
                      ...optimizationSettings,
                      populationSize: value
                    })}
                    min={20}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taxa de Mutação: {(optimizationSettings.mutationRate * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[optimizationSettings.mutationRate * 100]}
                    onValueChange={([value]) => onOptimizationSettingsChange({
                      ...optimizationSettings,
                      mutationRate: value / 100
                    })}
                    min={5}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Limite de Tempo: {optimizationSettings.timeLimit}s</Label>
                  <Slider
                    value={[optimizationSettings.timeLimit]}
                    onValueChange={([value]) => onOptimizationSettingsChange({
                      ...optimizationSettings,
                      timeLimit: value
                    })}
                    min={30}
                    max={600}
                    step={30}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Opções Adicionais */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Habilitar Aninhamento Avançado</Label>
                <p className="text-sm text-gray-600">Permite encaixe de peças menores dentro de recortes</p>
              </div>
              <Switch
                checked={optimizationSettings.enableNesting}
                onCheckedChange={(checked) => onOptimizationSettingsChange({
                  ...optimizationSettings,
                  enableNesting: checked
                })}
              />
            </div>
          </div>

          {/* Avisos */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Dicas de Performance:</p>
              <ul className="text-yellow-700 mt-1 space-y-1">
                <li>• Modo "Velocidade" para testes rápidos</li>
                <li>• Modo "Eficiência" para produção final</li>
                <li>• Aninhamento aumenta tempo de processamento</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
