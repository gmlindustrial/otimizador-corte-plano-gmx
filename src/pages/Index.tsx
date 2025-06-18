
import { useState } from 'react';
import { Header } from '@/components/Header';
import { ProjectSelector } from '@/components/ProjectSelector';
import { MaterialInput } from '@/components/MaterialInput';
import { OptimizationResults } from '@/components/OptimizationResults';
import { Dashboard } from '@/components/Dashboard';
import { HistoryPanel } from '@/components/HistoryPanel';
import { EstoqueSobras } from '@/components/EstoqueSobras';
import { CadastroManager } from '@/components/CadastroManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Calculator, History, Settings, Package } from 'lucide-react';

export interface CutPiece {
  length: number;
  quantity: number;
  id: string;
}

export interface OptimizationResult {
  bars: Array<{
    id: string;
    pieces: Array<{ length: number; color: string; label: string }>;
    waste: number;
    totalUsed: number;
  }>;
  totalBars: number;
  totalWaste: number;
  wastePercentage: number;
  efficiency: number;
}

export interface Project {
  id: string;
  name: string;
  projectNumber: string;
  client: string;
  obra: string;
  lista: string;
  revisao: string;
  tipoMaterial: string;
  operador: string;
  turno: string;
  aprovadorQA: string;
  validacaoQA: boolean;
  enviarSobrasEstoque: boolean;
  qrCode: string;
  date: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('optimize');
  const [project, setProject] = useState<Project | null>(null);
  const [barLength, setBarLength] = useState(6000);
  const [pieces, setPieces] = useState<CutPiece[]>([]);
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [optimizationHistory, setOptimizationHistory] = useState<Array<{
    id: string;
    project: Project;
    pieces: CutPiece[];
    results: OptimizationResult;
    date: string;
    barLength: number;
  }>>([]);

  const handleOptimize = () => {
    if (pieces.length === 0) return;

    // Implementação do algoritmo First Fit Decreasing
    const sortedPieces: Array<{ length: number; originalIndex: number }> = [];
    pieces.forEach((piece, index) => {
      for (let i = 0; i < piece.quantity; i++) {
        sortedPieces.push({ length: piece.length, originalIndex: index });
      }
    });
    
    // Ordenar por tamanho decrescente
    sortedPieces.sort((a, b) => b.length - a.length);

    const bars: Array<{
      id: string;
      pieces: Array<{ length: number; color: string; label: string }>;
      waste: number;
      totalUsed: number;
    }> = [];

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

    sortedPieces.forEach((piece) => {
      const cutLoss = 3; // 3mm perda por corte
      let placed = false;

      // Tentar colocar na barra existente
      for (const bar of bars) {
        const availableSpace = barLength - bar.totalUsed;
        const spaceNeeded = piece.length + (bar.pieces.length > 0 ? cutLoss : 0);
        
        if (availableSpace >= spaceNeeded) {
          bar.pieces.push({
            length: piece.length,
            color: colors[piece.originalIndex % colors.length],
            label: `${piece.length}mm`
          });
          bar.totalUsed += spaceNeeded;
          bar.waste = barLength - bar.totalUsed;
          placed = true;
          break;
        }
      }

      // Se não coube, criar nova barra
      if (!placed) {
        const newBar = {
          id: `bar-${bars.length + 1}`,
          pieces: [{
            length: piece.length,
            color: colors[piece.originalIndex % colors.length],
            label: `${piece.length}mm`
          }],
          waste: 0,
          totalUsed: piece.length
        };
        newBar.waste = barLength - newBar.totalUsed;
        bars.push(newBar);
      }
    });

    const totalWaste = bars.reduce((sum, bar) => sum + bar.waste, 0);
    const totalMaterial = bars.length * barLength;
    const wastePercentage = (totalWaste / totalMaterial) * 100;

    const optimizationResult: OptimizationResult = {
      bars,
      totalBars: bars.length,
      totalWaste,
      wastePercentage,
      efficiency: 100 - wastePercentage
    };

    setResults(optimizationResult);

    // Salvar no histórico e enviar sobras para estoque se habilitado
    if (project) {
      const historyEntry = {
        id: Date.now().toString(),
        project,
        pieces: [...pieces],
        results: optimizationResult,
        date: new Date().toISOString(),
        barLength
      };
      setOptimizationHistory(prev => [historyEntry, ...prev]);

      // Auto-enviar sobras para estoque se habilitado
      if (project.enviarSobrasEstoque && optimizationResult.totalWaste > 0) {
        console.log('Enviando sobras automaticamente para o estoque:', {
          totalWaste: optimizationResult.totalWaste,
          material: project.tipoMaterial,
          projeto: project.projectNumber
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="optimize" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Otimização
            </TabsTrigger>
            <TabsTrigger value="sobras" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Estoque
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard history={optimizationHistory} />
          </TabsContent>

          <TabsContent value="optimize" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ProjectSelector
                  project={project}
                  setProject={setProject}
                  barLength={barLength}
                  setBarLength={setBarLength}
                />
                
                <MaterialInput
                  pieces={pieces}
                  setPieces={setPieces}
                  onOptimize={handleOptimize}
                  disabled={!project}
                />
              </div>
              
              <div className="lg:col-span-1">
                {results && (
                  <OptimizationResults
                    results={results}
                    barLength={barLength}
                    project={project}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sobras">
            <EstoqueSobras tipoMaterial={project?.tipoMaterial} />
          </TabsContent>

          <TabsContent value="history">
            <HistoryPanel
              history={optimizationHistory}
              onLoadHistory={(entry) => {
                setProject(entry.project);
                setPieces(entry.pieces);
                setResults(entry.results);
                setBarLength(entry.barLength);
                setActiveTab('optimize');
              }}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <CadastroManager onUpdateData={() => {
              // Callback para atualizar dados quando novos cadastros são criados
              console.log('Dados atualizados - recarregando listas...');
            }} />
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Configurações do Sistema</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Configurações de Corte</h4>
                  <p className="text-sm text-gray-600">• Perda por corte: 3mm</p>
                  <p className="text-sm text-gray-600">• Comprimento padrão de barras: 6000mm</p>
                  <p className="text-sm text-gray-600">• Algoritmo: First Fit Decreasing (FFD)</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Integração Supabase</h4>
                  <p className="text-sm text-gray-600">• Status: Conectado</p>
                  <p className="text-sm text-gray-600">• Projeto: uspmlzuhzlbwubdrzooy</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
