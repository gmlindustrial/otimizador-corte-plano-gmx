import { useState, useEffect } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { HistoryPanel } from "@/components/HistoryPanel";
import { EstoqueSobrasIntegrated } from "@/components/EstoqueSobrasIntegrated";
import { CadastroManagerIntegrated } from "@/components/CadastroManagerIntegrated";
import { SheetCuttingSettings } from "@/components/settings/SheetCuttingSettings";
import { BarCuttingSettings } from "@/components/settings/BarCuttingSettings";
import { ReportsManager } from "@/components/reports/ReportsManager";
import { LinearCuttingTab } from "@/components/optimization/LinearCuttingTab";
import { SheetCuttingTab } from "@/components/optimization/SheetCuttingTab";
import { ProjectManagementTab } from "@/components/projects/ProjectManagementTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Calculator,
  History,
  Settings,
  Package,
  Square,
  FileText,
  Shield,
  Folder,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminUsuarios from "./AdminUsuarios";
import { cn } from "@/lib/utils";
import { BottomLeftFillOptimizer } from "@/algorithms/sheet/BottomLeftFill";
import { useOptimizationHistoryPersistent } from "@/hooks/useOptimizationHistoryPersistent";
import { useLinearProjects } from "@/hooks/useLinearProjects";
import { useSheetProjects } from "@/hooks/useSheetProjects";
import { useLinearOptimization } from "@/hooks/useLinearOptimization";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import type {
  SheetCutPiece,
  SheetProject,
  SheetOptimizationResult,
} from "@/types/sheet";

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
  enviarSobrasEstoque: boolean;
  date: string;
}

const Index = () => {
  useAuthGuard();
  const [activeTab, setActiveTab] = useState("projects");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Get materials data from useSupabaseData
  const { materiaisBarras, materiaisChapas } = useSupabaseData();

  // Linear cutting optimization with persistent projects
  const { savedProjects: savedLinearProjects, saveProject: saveLinearProject } =
    useLinearProjects();
  const {
    project,
    setProject,
    barLength,
    setBarLength,
    pieces,
    setPieces,
    results,
    setResults,
    handleOptimize,
  } = useLinearOptimization();

  // Optimization history - now persistent
  const {
    optimizationHistory,
    addToHistory,
    loading: historyLoading,
  } = useOptimizationHistoryPersistent();

  // Sheet cutting with persistent projects
  const { savedProjects: savedSheetProjects, saveProject: saveSheetProject } =
    useSheetProjects();
  const [sheetProject, setSheetProject] = useState<SheetProject | null>(null);
  const [sheetPieces, setSheetPieces] = useState<SheetCutPiece[]>([]);
  const [sheetResults, setSheetResults] =
    useState<SheetOptimizationResult | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("usuarios")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (data?.role === "administrador") {
        setIsAdmin(true);
      }
    };
    void fetchRole();
  }, []);

  const handleLinearOptimize = async () => {
    const result = handleOptimize();

    // Save project and add to history if project exists
    if (project && pieces.length > 0 && result) {
      try {
        // Only save to history - OptimizationHistoryService will handle project creation
        await addToHistory(project, pieces, result, barLength);

        console.log("Projeto salvo com sucesso no Supabase");
      } catch (error) {
        console.error("Erro ao salvar projeto/histórico:", error);
      }
    }
  };

  const handleSheetOptimize = async () => {
    if (sheetPieces.length === 0 || !sheetProject) return;

    const optimizer = new BottomLeftFillOptimizer(
      sheetProject.sheetWidth,
      sheetProject.sheetHeight,
      sheetProject.kerf
    );

    const optimizationResult = optimizer.optimize(sheetPieces);
    setSheetResults(optimizationResult);

    // Save sheet project
    try {
      await saveSheetProject({ project: sheetProject, pieces: sheetPieces });
      console.log("Projeto de chapas salvo com sucesso");
    } catch (error) {
      console.error("Erro ao salvar projeto de chapas:", error);
    }

    console.log("Otimização de chapas concluída:", {
      totalSheets: optimizationResult.totalSheets,
      efficiency: optimizationResult.averageEfficiency,
      totalWeight: optimizationResult.totalWeight,
    });
  };

  // Handlers para carregar projetos salvos
  const handleLoadLinearProject = (projectData: any) => {
    setProject(projectData.project);
    setPieces(projectData.pieces);
    setBarLength(projectData.barLength);
    setActiveTab("optimize");
  };

  const handleLoadSheetProject = (projectData: any) => {
    setSheetProject(projectData.project);
    setSheetPieces(projectData.pieces);
    setActiveTab("sheet-cutting");
  };

  // Helper function to find material info
  const findMaterialInfo = (materialId: string | undefined) => {
    if (!materialId) return { id: undefined, tipo: undefined };

    // Check if materialId is already a valid UUID (from project data)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        materialId
      );

    if (isUUID) {
      // If it's a UUID, find the material type by ID
      const allMaterials = [...materiaisBarras, ...materiaisChapas];
      const material = allMaterials.find((m) => m.id === materialId);
      return { id: materialId, tipo: material?.tipo };
    } else {
      // If it's a material type string, find the ID
      const allMaterials = [...materiaisBarras, ...materiaisChapas];
      const material = allMaterials.find((m) => m.tipo === materialId);
      return { id: material?.id, tipo: material?.tipo };
    }
  };

  const materialInfo = findMaterialInfo(project?.tipoMaterial);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={cn(
              "grid w-full mb-6",
              isAdmin ? "grid-cols-7" : "grid-cols-6"
            )}
          >
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Projetos
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
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Administrador
              </TabsTrigger>
            )}
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

          <TabsContent value="projects">
            <ProjectManagementTab
              selectedProject={selectedProject}
              onProjectSelect={setSelectedProject}
              onLoadLinearProject={handleLoadLinearProject}
              onLoadSheetProject={handleLoadSheetProject}
            />
          </TabsContent>

          <TabsContent value="sobras">
            <EstoqueSobrasIntegrated
              materialId={materialInfo.id}
              tipoMaterial={materialInfo.tipo}
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryPanel
              history={optimizationHistory}
              onLoadHistory={(entry) => {
                setProject(entry.project);
                setPieces(entry.pieces);
                setResults(entry.results);
                setBarLength(entry.barLength);
                setActiveTab("optimize");
              }}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsManager optimizationHistory={optimizationHistory} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <CadastroManagerIntegrated
              onUpdateData={() => {
                console.log("Dados atualizados - recarregando listas...");
              }}
            />

            <BarCuttingSettings />

            <SheetCuttingSettings />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="admin">
              <AdminUsuarios />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
