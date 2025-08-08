import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderPlus, Upload, Calculator, AlertTriangle } from "lucide-react";
import { ProjectsList } from "./ProjectsList";
import { ProjectDetailsView } from "./ProjectDetailsView";
import { ProjectEditDialog } from "./ProjectEditDialog";
import { ProjectDeleteDialog } from "./ProjectDeleteDialog";
import { ProjectCreationWizard } from "./ProjectCreationWizard";
import { PieceRegistrationForm } from "./PieceRegistrationForm";
import { FileUploadDialog } from "./FileUploadDialog";
import { ProfileGroupingView } from "./ProfileGroupingView";
import { ProjectValidationAlert } from "./ProjectValidationAlert";
import { projetoPecaService } from "@/services/entities/ProjetoPecaService";
import { projetoOtimizacaoService } from "@/services/entities/ProjetoOtimizacaoService";
import type { ProjetoPeca, ProjectPieceValidation } from "@/types/project";
import { runLinearOptimizationWithLeftovers } from "@/lib/runLinearOptimization";
import { estoqueSobrasService } from "@/services/entities/EstoqueSobrasService";
import { WasteStockService } from "@/services/WasteStockService";
import { toast } from "sonner";

interface Projeto {
  id: string;
  nome: string;
  numero_projeto: string;
  cliente_id: string;
  obra_id: string;
  created_at: string;
  clientes?: { nome: string };
  obras?: { nome: string };
}

interface ProjectManagementTabProps {
  onNavigateToProfileManagement?: () => void;
}

export const ProjectManagementTab = ({
  onNavigateToProfileManagement,
}: ProjectManagementTabProps = {}) => {
  const [view, setView] = useState<"list" | "details" | "create">("list");
  const [selectedProject, setSelectedProject] = useState<Projeto | null>(null);
  const [editingProject, setEditingProject] = useState<Projeto | null>(null);
  const [deletingProject, setDeletingProject] = useState<Projeto | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleProjectSelect = (project: Projeto) => {
    setSelectedProject(project);
    setView("details");
  };

  const handleProjectEdit = (project: Projeto) => {
    setEditingProject(project);
    setShowEditDialog(true);
  };

  const handleProjectDelete = (project: Projeto) => {
    setDeletingProject(project);
    setShowDeleteDialog(true);
  };

  const handleCreateNew = () => {
    setView("create");
  };

  const handleBack = () => {
    setSelectedProject(null);
    setView("list");
  };

  const handleProjectCreated = (project: Projeto) => {
    setSelectedProject(project);
    setView("details");
  };

  const handleProjectUpdated = (project: Projeto) => {
    setSelectedProject(project);
    if (view === "details") {
      // Refresh the details view
    }
  };

  const handleProjectDeleted = () => {
    setSelectedProject(null);
    setDeletingProject(null);
    setView("list");
  };

  const handleCreateOptimization = async (
    selectedPieces: ProjetoPeca[],
    name: string,
    barLength: number
  ) => {
    if (!selectedProject || selectedPieces.length === 0) return;

    // Validação adicional: verificar se todas as peças têm perfil
    const piecesWithoutProfile = selectedPieces.filter(
      (piece) => !piece.perfil_id
    );
    if (piecesWithoutProfile.length > 0) {
      toast.error(
        `Erro: ${piecesWithoutProfile.length} peça(s) sem perfil definido. Defina os perfis antes de criar a otimização.`
      );
      return;
    }

    try {
      const piecesForAlgo = selectedPieces.map((p) => ({
        length: p.comprimento_mm,
        quantity: p.quantidade,
        tag: p.tag || undefined,
        posicao: p.posicao,
        perfil:
          p.perfil?.descricao_perfil || p.descricao_perfil_raw || undefined,
        peso: p.peso || undefined,
      }));

      const stockResp = await estoqueSobrasService.getAll();
      const sobras = stockResp.success && stockResp.data ? stockResp.data : [];

      const usedPerfilIds = Array.from(new Set(
        selectedPieces.map((p) => p.perfil_id).filter(Boolean)
      )) as string[];

      const singlePerfilId = usedPerfilIds.length === 1 ? usedPerfilIds[0] : null;

      const sobrasFiltradas = singlePerfilId
        ? (sobras as any[]).filter((sobra: any) => sobra.id_perfis_materiais === singlePerfilId)
        : [];

      const sobrasForAlgo = sobrasFiltradas.map((s: any) => ({
        id: s.id,
        comprimento: s.comprimento,
        quantidade: s.quantidade,
        id_perfis_materiais: s.id_perfis_materiais,
        perfis_materiais: {
          id: s.id_perfis_materiais,
          descricao_perfil: '',
          kg_por_metro: 0,
          tipo_perfil: '',
          created_at: new Date().toISOString(),
        },
      }));

      console.log('Sobras utilizadas na otimização:', sobrasForAlgo);

      const resultWithLeftovers = runLinearOptimizationWithLeftovers(
        piecesForAlgo,
        barLength,
        sobrasForAlgo
      );

      const created = await projetoOtimizacaoService.create({
        data: {
          projeto_id: selectedProject.id,
          nome_lista: name,
          tamanho_barra: barLength,
          perfil_id: singlePerfilId || undefined,
          pecas_selecionadas: selectedPieces.map((p) => p.id) as any,
          resultados: resultWithLeftovers as any,
        },
      });

      if (created.success && created.data) {
        for (const [id, qtyStr] of Object.entries(
          resultWithLeftovers.leftoverUsage
        )) {
          const qty = parseInt(qtyStr, 10);
          const sobra = sobras.find((s) => s.id === id);
          if (sobra && qty > 0 && qty <= sobra.quantidade) {
            await estoqueSobrasService.useQuantity(id, qty);
          } else {
            console.warn(
              `Tentativa de usar sobra inválida: ${id}, qty: ${qty}, sobra existente:`,
              sobra
            );
          }
        }

        // Detectar perfil mais comum nas peças selecionadas
        const perfilIds = selectedPieces
          .map((p) => p.perfil_id)
          .filter(Boolean);
        const mostCommonPerfilId =
          perfilIds.length > 0
            ? perfilIds.reduce((a, b, i, arr) =>
                arr.filter((v) => v === a).length >=
                arr.filter((v) => v === b).length
                  ? a
                  : b
              )
            : undefined;

        await WasteStockService.addWasteToStock(
          created.data.id,
          resultWithLeftovers,
          mostCommonPerfilId
        );

        // Remover peças somente após a criação bem-sucedida
        await Promise.all(
          selectedPieces.map((p) => projetoPecaService.delete(p.id))
        );

        toast.success("Otimização criada com sucesso");
      } else {
        console.error("Falha ao criar otimização:", created.error);
        toast.error(`Erro ao criar otimização: ${created.error || 'desconhecido'}`);
      }

    } catch (err) {
      console.error("Erro ao criar otimização:", err);
      toast.error("Erro ao criar otimização");
    }
  };

  if (view === "create") {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            Criar Novo Projeto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ProjectCreationWizard onProjectCreated={handleProjectCreated} />
        </CardContent>
      </Card>
    );
  }

  if (view === "details" && selectedProject) {
    return (
      <>
        <ProjectDetailsView
          project={selectedProject}
          onBack={handleBack}
          onEdit={() => handleProjectEdit(selectedProject)}
          onDelete={() => handleProjectDelete(selectedProject)}
          onCreateOptimization={handleCreateOptimization}
          onNavigateToProfileManagement={onNavigateToProfileManagement}
        />

        <ProjectEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          project={editingProject}
          onProjectUpdated={handleProjectUpdated}
        />

        <ProjectDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          project={deletingProject}
          onProjectDeleted={handleProjectDeleted}
        />
      </>
    );
  }

  return (
    <>
      <ProjectsList
        onProjectSelect={handleProjectSelect}
        onProjectEdit={handleProjectEdit}
        onProjectDelete={handleProjectDelete}
        onCreateNew={handleCreateNew}
      />

      <ProjectEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        project={editingProject}
        onProjectUpdated={handleProjectUpdated}
      />

      <ProjectDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        project={deletingProject}
        onProjectDeleted={handleProjectDeleted}
      />
    </>
  );
};
