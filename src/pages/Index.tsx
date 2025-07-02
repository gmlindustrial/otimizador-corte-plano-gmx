
import { useState } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { HistoryPanel } from '@/components/HistoryPanel';
import { EstoqueSobras } from '@/components/EstoqueSobras';
import { CadastroManagerIntegrated } from '@/components/CadastroManagerIntegrated';
import { SheetCuttingSettings } from '@/components/settings/SheetCuttingSettings';
import { BarCuttingSettings } from '@/components/settings/BarCuttingSettings';
import { ReportsManager } from '@/components/reports/ReportsManager';
import { LinearCuttingTab } from '@/components/optimization/LinearCuttingTab';
import { SheetCuttingTab } from '@/components/optimization/SheetCuttingTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Calculator, History, Settings, Package, Square, FileText } from 'lucide-react';
import { BottomLeftFillOptimizer } from '@/algorithms/sheet/BottomLeftFill';
import { useOptimizationHistory } from '@/hooks/useOptimizationHistory';
import { useLinearOptimization } from '@/hooks/useLinearOptimization';
import type { SheetCutPiece, SheetProject, SheetOptimizationResult } from '@/types/sheet';

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
  useAuthGuard()
  const [activeTab, setActiveTab] = useState('optimize');
  
  // Linear cutting optimization
  const {
    project,
    setProject,
    barLength,
    setBarLength,
    pieces,
    setPieces,
    results,
    setResults,
    handleOptimize
  } = useLinearOptimization();

  // Optimization history
  const { optimizationHistory, addToHistory } = useOptimizationHistory();

  // Estados para corte de chapas
  const [sheetProject, setSheetProject] = useState<SheetProject | null>(null);
  const [sheetPieces, setSheetPieces] = useState<SheetCutPiece[]>([]);
  const [sheetResults, setSheetResults] = useState<SheetOptimizationResult | null>(null);

  const handleLinearOptimize = () => {
    handleOptimize(addToHistory);
  };

  const handleSheetOptimize = () => {
    if (sheetPieces.length === 0 || !sheetProject) return;

    const optimizer = new BottomLeftFillOptimizer(
      sheetProject.sheetWidth,
      sheetProject.sheetHeight,
      sheetProject.kerf
    );

    const optimizationResult = optimizer.optimize(sheetPieces);
    setSheetResults(optimizationResult);

    console.log('Otimização de chapas concluída:', {
      totalSheets: optimizationResult.totalSheets,
      efficiency: optimizationResult.averageEfficiency,
      totalWeight: optimizationResult.totalWeight
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="optimize" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Corte Linear
            </TabsTrigger>
            <TabsTrigger value="sheet-cutting" className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              Corte Chapas
            </TabsTrigger>
            <TabsTrigger value="sobras" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Estoque
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard history={optimizationHistory} />
          </TabsContent>

          <TabsContent value="optimize">
            <LinearCuttingTab
              project={project}
              setProject={setProject}
              barLength={barLength}
              setBarLength={setBarLength}
              pieces={pieces}
              setPieces={setPieces}
              results={results}
              onOptimize={handleLinearOptimize}
            />
          </TabsContent>

          <TabsContent value="sheet-cutting">
            <SheetCuttingTab
              sheetProject={sheetProject}
              setSheetProject={setSheetProject}
              sheetPieces={sheetPieces}
              setSheetPieces={setSheetPieces}
              sheetResults={sheetResults}
              onOptimize={handleSheetOptimize}
            />
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

          <TabsContent value="reports">
            <ReportsManager optimizationHistory={optimizationHistory} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <CadastroManagerIntegrated onUpdateData={() => {
              console.log('Dados atualizados - recarregando listas...');
            }} />
            
            <BarCuttingSettings />
            
            <SheetCuttingSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
