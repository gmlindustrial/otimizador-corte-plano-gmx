import { useState, useEffect } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { EstoqueSobrasIntegrated } from "@/components/EstoqueSobrasIntegrated";
import { CadastroManagerIntegrated } from "@/components/CadastroManagerIntegrated";
import { SheetCuttingSettings } from "@/components/settings/SheetCuttingSettings";
import { BarCuttingSettings } from "@/components/settings/BarCuttingSettings";
import { ReportsManager } from "@/components/reports/ReportsManager";
import { LinearCuttingTab } from "@/components/optimization/LinearCuttingTab";
import { SheetCuttingTab } from "@/components/optimization/SheetCuttingTab";
import { ProjectManagementTab } from "@/components/projects/ProjectManagementTab";
import { Laminas } from "./Laminas";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import AdminUsuarios from "./AdminUsuarios";
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
  tag?: string;
  posicao?: string;
  fase?: string;
  conjunto?: string;
  perfil?: string;
  material?: string;
  peso?: number;
}

export interface OptimizationResult {
  bars: Array<{
    id: string;
    pieces: Array<{
      length: number;
      color: string;
      label: string;
      tag?: string;
      conjunto?: string;
      perfil?: string;
      peso?: number;
      posicao?: string;
      cortada?: boolean;
    }>;
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
  tipoMaterial: string;
  lista: string;
  revisao: string;
  turno: string;
  operador: string;
  aprovadorQA: string;
  validacaoQA: boolean;
  qrCode: string;
}

const Index = () => {
  useAuthGuard();
  const [activeSection, setActiveSection] = useState("projects");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { materiaisBarras, materiaisChapas } = useSupabaseData();

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
    selectedPerfilId,
    setSelectedPerfilId,
    handleOptimize,
  } = useLinearOptimization();

  const {
    optimizationHistory,
    addToHistory,
    loading: historyLoading,
  } = useOptimizationHistoryPersistent();

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

  const handleLinearOptimize = async (customBarSize?: number) => {
    const originalBarLength = barLength;
    if (customBarSize) {
      setBarLength(customBarSize);
    }

    const result = await handleOptimize(selectedPerfilId);

    if (project && pieces.length > 0 && result) {
      try {
        const usedBarLength = customBarSize || barLength;
        await addToHistory(project, pieces, result, usedBarLength, selectedPerfilId);
        console.log("Projeto salvo com sucesso no Supabase");
      } catch (error) {
        console.error("Erro ao salvar projeto/histórico:", error);
      }
    }

    if (customBarSize && customBarSize !== originalBarLength) {
      setBarLength(originalBarLength);
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

  const handleLoadLinearProject = (projectData: any) => {
    setProject(projectData.project);
    setPieces(projectData.pieces);
    setBarLength(projectData.barLength);
    setActiveSection("optimize");
  };

  const handleLoadSheetProject = (projectData: any) => {
    setSheetProject(projectData.project);
    setSheetPieces(projectData.pieces);
    setActiveSection("sheet-cutting");
  };

  const findMaterialInfo = (materialId: string | undefined) => {
    if (!materialId) return { id: undefined, tipo: undefined };

    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        materialId
      );

    if (isUUID) {
      const allMaterials = [...materiaisBarras, ...materiaisChapas];
      const material = allMaterials.find((m) => m.id === materialId);
      return { id: materialId, tipo: material?.tipo };
    } else {
      const allMaterials = [...materiaisBarras, ...materiaisChapas];
      const material = allMaterials.find((m) => m.tipo === materialId);
      return { id: material?.id, tipo: material?.tipo };
    }
  };

  const materialInfo = findMaterialInfo(project?.tipoMaterial);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard history={optimizationHistory} />;
      case "projects":
        return (
          <ProjectManagementTab
            onNavigateToProfileManagement={() => setActiveSection("settings")}
          />
        );
      case "optimize":
        return (
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
        );
      case "sheet-cutting":
        return (
          <SheetCuttingTab
            sheetProject={sheetProject}
            setSheetProject={setSheetProject}
            sheetPieces={sheetPieces}
            setSheetPieces={setSheetPieces}
            sheetResults={sheetResults}
            onOptimize={handleSheetOptimize}
          />
        );
      case "sobras":
        return <EstoqueSobrasIntegrated />;
      case "reports":
        return <ReportsManager optimizationHistory={optimizationHistory} />;
      case "settings":
        return (
          <div className="space-y-6">
            <CadastroManagerIntegrated
              onUpdateData={() => {
                console.log("Dados atualizados - recarregando listas...");
              }}
            />
            <BarCuttingSettings />
            <SheetCuttingSettings />
          </div>
        );
      case "laminas":
        return <Laminas />;
      case "admin":
        return isAdmin ? <AdminUsuarios /> : null;
      default:
        return <ProjectManagementTab onNavigateToProfileManagement={() => setActiveSection("settings")} />;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isAdmin={isAdmin}
      />
      <SidebarInset>
        <Header />
        <div className="flex-1 p-4 md:p-6">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Index;
