
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Cpu, Scissors, Target, RotateCw, Save, RefreshCw } from 'lucide-react';

interface OptimizationSettings {
  algorithm: 'BLF' | 'Genetic' | 'NFP' | 'Hybrid';
  strategies: {
    efficiency: { enabled: boolean; weight: number; };
    wasteReduction: { enabled: boolean; weight: number; };
    cuttingTime: { enabled: boolean; weight: number; };
    thermalDistortion: { enabled: boolean; weight: number; };
  };
  genetic: {
    populationSize: number;
    generations: number;
    mutationRate: number;
    crossoverRate: number;
  };
  cutting: {
    entryStrategy: 'corner' | 'edge' | 'center';
    sequenceOptimization: boolean;
    thermalControl: boolean;
    leadInDistance: number;
  };
  quality: {
    kerfCompensation: boolean;
    pierceDelay: number;
    cutSpeed: number;
    powerLevel: number;
  };
}

interface SheetAdvancedSettingsProps {
  settings: OptimizationSettings;
  onSettingsChange: (settings: OptimizationSettings) => void;
  onReset: () => void;
  process: 'plasma' | 'oxicorte' | 'both';
}

export const SheetAdvancedSettings = ({ 
  settings, 
  onSettingsChange, 
  onReset,
  process 
}: SheetAdvancedSettingsProps) => {
  const [activeTab, setActiveTab] = useState('algorithm');

  const defaultSettings: OptimizationSettings = {
    algorithm: 'Hybrid',
    strategies: {
      efficiency: { enabled: true, weight: 40 },
      wasteReduction: { enabled: true, weight: 30 },
      cuttingTime: { enabled: true, weight: 20 },
      thermalDistortion: { enabled: false, weight: 10 }
    },
    genetic: {
      populationSize: 50,
      generations: 100,
      mutationRate: 10,
      crossoverRate: 80
    },
    cutting: {
      entryStrategy: process === 'plasma' ? 'corner' : 'edge',
      sequenceOptimization: true,
      thermalControl: process === 'oxicorte',
      leadInDistance: process === 'plasma' ? 2 : 4
    },
    quality: {
      kerfCompensation: true,
      pierceDelay: process === 'plasma' ? 0.5 : 1.0,
      cutSpeed: process === 'plasma' ? 3000 : 1500,
      powerLevel: process === 'plasma' ? 85 : 100
    }
  };

  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    onSettingsChange(newSettings);
  };

  const totalWeight = Object.values(settings.strategies)
    .filter(s => s.enabled)
    .reduce((sum, s) => sum + s.weight, 0);

  const normalizeWeights = () => {
    const enabledStrategies = Object.entries(settings.strategies).filter(([_, s]) => s.enabled);
    const equalWeight = Math.round(100 / enabledStrategies.length);
    
    enabledStrategies.forEach(([key, _]) => {
      updateSetting(`strategies.${key}.weight`, equalWeight);
    });
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-slate-600 to-gray-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurações Avançadas de Otimização
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="algorithm" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Algoritmo
            </TabsTrigger>
            <TabsTrigger value="cutting" className="flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              Corte
            </TabsTrigger>
            <TabsTrigger value="objectives" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Objetivos
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex items-center gap-2">
              <RotateCw className="w-4 h-4" />
              Qualidade
            </TabsTrigger>
          </TabsList>

          {/* Configurações de Algoritmo */}
          <TabsContent value="algorithm" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Algoritmo de Otimização</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Selecione o algoritmo principal para otimização do layout
                </p>
                <Select value={settings.algorithm} onValueChange={(value: any) => updateSetting('algorithm', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BLF">
                      <div className="flex flex-col">
                        <span>Bottom-Left Fill (BLF)</span>
                        <span className="text-xs text-gray-500">Rápido, eficiente para peças regulares</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Genetic">
                      <div className="flex flex-col">
                        <span>Algoritmo Genético</span>
                        <span className="text-xs text-gray-500">Otimização global, melhor para casos complexos</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="NFP">
                      <div className="flex flex-col">
                        <span>No-Fit Polygon</span>
                        <span className="text-xs text-gray-500">Precisão geométrica, formas irregulares</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Hybrid">
                      <div className="flex flex-col">
                        <span>Híbrido (Recomendado)</span>
                        <span className="text-xs text-gray-500">Combina múltiplos algoritmos automaticamente</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.algorithm === 'Genetic' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <Label className="font-medium">Parâmetros do Algoritmo Genético</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Tamanho da População</Label>
                      <Slider
                        value={[settings.genetic.populationSize]}
                        onValueChange={([value]) => updateSetting('genetic.populationSize', value)}
                        min={20}
                        max={100}
                        step={10}
                      />
                      <div className="text-xs text-gray-600 mt-1">{settings.genetic.populationSize} indivíduos</div>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Gerações</Label>
                      <Slider
                        value={[settings.genetic.generations]}
                        onValueChange={([value]) => updateSetting('genetic.generations', value)}
                        min={50}
                        max={200}
                        step={25}
                      />
                      <div className="text-xs text-gray-600 mt-1">{settings.genetic.generations} gerações</div>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Taxa de Mutação (%)</Label>
                      <Slider
                        value={[settings.genetic.mutationRate]}
                        onValueChange={([value]) => updateSetting('genetic.mutationRate', value)}
                        min={5}
                        max={25}
                        step={5}
                      />
                      <div className="text-xs text-gray-600 mt-1">{settings.genetic.mutationRate}%</div>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Taxa de Crossover (%)</Label>
                      <Slider
                        value={[settings.genetic.crossoverRate]}
                        onValueChange={([value]) => updateSetting('genetic.crossoverRate', value)}
                        min={60}
                        max={95}
                        step={5}
                      />
                      <div className="text-xs text-gray-600 mt-1">{settings.genetic.crossoverRate}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Configurações de Corte */}
          <TabsContent value="cutting" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Estratégia de Entrada</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Define onde o processo de corte inicia em cada peça
                </p>
                <Select value={settings.cutting.entryStrategy} onValueChange={(value: any) => updateSetting('cutting.entryStrategy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corner">Canto - Melhor qualidade plasma</SelectItem>
                    <SelectItem value="edge">Borda - Reduz deformação oxicorte</SelectItem>
                    <SelectItem value="center">Centro - Minimiza movimentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.cutting.sequenceOptimization}
                    onCheckedChange={(checked) => updateSetting('cutting.sequenceOptimization', checked)}
                  />
                  <div>
                    <Label className="text-sm">Otimização de Sequência</Label>
                    <p className="text-xs text-gray-500">Minimiza movimentos da máquina</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.cutting.thermalControl}
                    onCheckedChange={(checked) => updateSetting('cutting.thermalControl', checked)}
                  />
                  <div>
                    <Label className="text-sm">Controle Térmico</Label>
                    <p className="text-xs text-gray-500">Alterna regiões para resfriamento</p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm">Distância Lead-in (mm)</Label>
                <Slider
                  value={[settings.cutting.leadInDistance]}
                  onValueChange={([value]) => updateSetting('cutting.leadInDistance', value)}
                  min={1}
                  max={10}
                  step={0.5}
                />
                <div className="text-xs text-gray-600 mt-1">{settings.cutting.leadInDistance}mm</div>
              </div>
            </div>
          </TabsContent>

          {/* Objetivos Multi-critério */}
          <TabsContent value="objectives" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Pesos dos Objetivos</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={totalWeight === 100 ? "default" : "destructive"}>
                    Total: {totalWeight}%
                  </Badge>
                  <Button size="sm" variant="outline" onClick={normalizeWeights}>
                    Equalizar
                  </Button>
                </div>
              </div>

              {Object.entries(settings.strategies).map(([key, strategy]) => (
                <div key={key} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={strategy.enabled}
                      onCheckedChange={(checked) => updateSetting(`strategies.${key}.enabled`, checked)}
                    />
                    <Label className="text-sm font-medium">
                      {key === 'efficiency' && 'Eficiência de Material'}
                      {key === 'wasteReduction' && 'Redução de Desperdício'}
                      {key === 'cuttingTime' && 'Tempo de Corte'}
                      {key === 'thermalDistortion' && 'Distorção Térmica'}
                    </Label>
                  </div>
                  
                  {strategy.enabled && (
                    <div>
                      <Slider
                        value={[strategy.weight]}
                        onValueChange={([value]) => updateSetting(`strategies.${key}.weight`, value)}
                        min={5}
                        max={70}
                        step={5}
                        disabled={!strategy.enabled}
                      />
                      <div className="text-xs text-gray-600 mt-1">{strategy.weight}% de prioridade</div>
                    </div>
                  )}
                </div>
              ))}

              {totalWeight !== 100 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ A soma dos pesos deve ser 100%. Atual: {totalWeight}%
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Configurações de Qualidade */}
          <TabsContent value="quality" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.quality.kerfCompensation}
                  onCheckedChange={(checked) => updateSetting('quality.kerfCompensation', checked)}
                />
                <div>
                  <Label className="text-sm">Compensação de Kerf</Label>
                  <p className="text-xs text-gray-500">Ajusta dimensões para compensar largura do corte</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Delay de Perfuração (s)</Label>
                  <Input
                    type="number"
                    value={settings.quality.pierceDelay}
                    onChange={(e) => updateSetting('quality.pierceDelay', parseFloat(e.target.value))}
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {process === 'plasma' ? 'Plasma: 0.3-0.8s' : 'Oxicorte: 0.8-2.0s'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm">Velocidade de Corte (mm/min)</Label>
                  <Input
                    type="number"
                    value={settings.quality.cutSpeed}
                    onChange={(e) => updateSetting('quality.cutSpeed', parseInt(e.target.value))}
                    min="500"
                    max="5000"
                    step="100"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {process === 'plasma' ? 'Plasma: 2000-4000' : 'Oxicorte: 800-2000'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm">Nível de Potência (%)</Label>
                <Slider
                  value={[settings.quality.powerLevel]}
                  onValueChange={([value]) => updateSetting('quality.powerLevel', value)}
                  min={60}
                  max={100}
                  step={5}
                />
                <div className="text-xs text-gray-600 mt-1">{settings.quality.powerLevel}%</div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="text-sm font-medium text-blue-900">Processo: {process.toUpperCase()}</Label>
                <p className="text-xs text-blue-700 mt-1">
                  {process === 'plasma' 
                    ? 'Configurações otimizadas para corte a plasma - maior velocidade, menor delay'
                    : 'Configurações otimizadas para oxicorte - melhor controle térmico'
                  }
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onReset} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Restaurar Padrão
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              const config = JSON.stringify(settings, null, 2);
              const blob = new Blob([config], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'sheet-optimization-config.json';
              a.click();
            }}>
              Exportar Config
            </Button>
            
            <Button className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Salvar Configuração
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
