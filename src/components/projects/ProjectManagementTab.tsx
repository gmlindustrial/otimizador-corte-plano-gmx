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
import type { ProjetoPeca, ProjectPieceValidation, EmendaConfiguration } from "@/types/project";
import { runLinearOptimizationWithLeftovers } from "@/lib/runLinearOptimization";
import { BestFitOptimizer } from "@/algorithms/linear/BestFitOptimizer";
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
    barLength: number,
    emendaConfig?: EmendaConfiguration
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
      console.log('=== INICIANDO OTIMIZAÇÃO ===');
      console.log('Peças selecionadas:', selectedPieces.length);
      console.log('Tamanho da barra:', barLength);
      console.log('Configuração de emendas:', emendaConfig);
      console.log(`📦 Usar sobras do estoque: ${emendaConfig?.usarSobrasEstoque !== false}`);
      console.log(`📦 Cadastrar sobras geradas: ${emendaConfig?.cadastrarSobrasGeradas !== false}`);

      // Expandir peças por quantidade
      const expandedPieces: Array<{
        length: number;
        tag?: string;
        posicao?: string;
        fase?: string;
        perfil?: string;
        peso?: number;
        originalIndex: number;
      }> = [];

      selectedPieces.forEach((p, index) => {
        for (let i = 0; i < (p.quantidade || 1); i++) {
          expandedPieces.push({
            length: p.comprimento_mm,
            tag: p.tag || undefined,
            posicao: p.posicao,
            fase: p.fase || undefined,
            perfil: p.perfil?.descricao_perfil || p.descricao_perfil_raw || undefined,
            peso: p.peso || undefined,
            originalIndex: index,
          });
        }
      });

      console.log('Peças expandidas:', expandedPieces.length);

      const stockResp = await estoqueSobrasService.getAll();
      const sobras = stockResp.success && stockResp.data ? stockResp.data : [];

      const usedPerfilIds = Array.from(new Set(
        selectedPieces.map((p) => p.perfil_id).filter(Boolean)
      )) as string[];

      const singlePerfilId = usedPerfilIds.length === 1 ? usedPerfilIds[0] : null;

      const sobrasFiltradas = singlePerfilId
        ? (sobras as any[]).filter((sobra: any) => sobra.id_perfis_materiais === singlePerfilId)
        : [];

      // Mapear sobras para formato do algoritmo
      const sobrasForAlgoRaw = sobrasFiltradas.map((s: any) => ({
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

      // Filtrar sobras baseado na configuração - se usarSobrasEstoque = false, não usar sobras
      const sobrasForAlgo = emendaConfig?.usarSobrasEstoque !== false
        ? sobrasForAlgoRaw
        : [];

      console.log('Sobras disponíveis no estoque:', sobrasForAlgoRaw.length);
      console.log('Sobras que serão utilizadas na otimização:', sobrasForAlgo.length);

      // Usar BestFitOptimizer para melhor resultado
      const optimizer = new BestFitOptimizer();
      const optimizationResult = await optimizer.optimize(
        expandedPieces,
        barLength,
        sobrasForAlgo,
        emendaConfig
      );

      console.log('=== RESULTADO DA OTIMIZAÇÃO ===');
      console.log('Estratégia utilizada:', optimizationResult.strategy);
      console.log('Barras geradas:', optimizationResult.bars.length);
      console.log('Eficiência:', optimizationResult.efficiency.toFixed(1), '%');
      console.log('Desperdício total:', optimizationResult.totalWaste, 'mm');

      // Log das barras com emendas
      const barrasComEmenda = optimizationResult.bars.filter((b: any) => b.geraSobra || b.sobraUsada || b.temEmenda);
      console.log(`Barras com informação de emenda: ${barrasComEmenda.length}`);
      barrasComEmenda.forEach((b: any) => {
        console.log(`  - Barra ${b.id}: geraSobra=${b.geraSobra}, sobraUsada=${b.sobraUsada}, temEmenda=${b.temEmenda}`);
      });

      // Converter para formato compatível com o sistema existente
      const resultWithLeftovers = {
        bars: optimizationResult.bars.map((bar, index) => ({
          id: bar.id || `bar-${index + 1}`,
          pieces: bar.pieces.map((piece: any) => ({
            length: piece.length,
            color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][piece.originalIndex % 5],
            label: piece.tag || `${piece.length}mm`,
            tag: piece.tag,
            fase: piece.fase,
            perfil: piece.perfil,
            peso: piece.peso,
            posicao: piece.posicao,
          })),
          waste: bar.waste,
          totalUsed: bar.totalUsed,
          originalLength: bar.originalLength,
          type: bar.type,
          estoque_id: bar.estoque_id,
          // Campos de emenda interna
          geraSobra: (bar as any).geraSobra,
          sobraComprimento: (bar as any).sobraComprimento,
          sobraUtilizavel: (bar as any).sobraUtilizavel,
          sobraUsada: (bar as any).sobraUsada,
          temEmenda: (bar as any).temEmenda,
        })),
        totalBars: optimizationResult.bars.length,
        totalWaste: optimizationResult.totalWaste,
        wastePercentage: 100 - optimizationResult.efficiency,
        efficiency: optimizationResult.efficiency,
        leftoverUsage: {} as Record<string, string>,
      };

      // Calcular uso de sobras
      optimizationResult.bars.forEach(bar => {
        if (bar.type === 'leftover' && bar.estoque_id) {
          resultWithLeftovers.leftoverUsage[bar.estoque_id] = String(
            parseInt(resultWithLeftovers.leftoverUsage[bar.estoque_id] || '0', 10) + 1
          );
        }
      });

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
        let sobrasUsadas = 0;
        let sobrasGeradas = 0;

        // Atualizar estoque de sobras usadas (apenas se usarSobrasEstoque = true)
        if (emendaConfig?.usarSobrasEstoque !== false) {
          for (const [id, qtyStr] of Object.entries(
            resultWithLeftovers.leftoverUsage
          )) {
            const qty = parseInt(qtyStr, 10);
            const sobra = sobras.find((s) => s.id === id);
            if (sobra && qty > 0 && qty <= sobra.quantidade) {
              await estoqueSobrasService.useQuantity(id, qty);
              sobrasUsadas += qty;
            } else {
              console.warn(
                `Tentativa de usar sobra inválida: ${id}, qty: ${qty}, sobra existente:`,
                sobra
              );
            }
          }
          console.log(`📦 Sobras consumidas do estoque: ${sobrasUsadas}`);
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

        // Cadastrar sobras geradas (apenas se cadastrarSobrasGeradas = true)
        if (emendaConfig?.cadastrarSobrasGeradas !== false) {
          const addResult = await WasteStockService.addWasteToStock(
            created.data.id,
            resultWithLeftovers,
            mostCommonPerfilId
          );
          // Contar sobras geradas (barras com waste > 50mm, que é o mínimo para cadastro)
          sobrasGeradas = resultWithLeftovers.bars.filter(b => b.waste > 50).length;
          console.log(`📦 Sobras cadastradas no estoque: ${sobrasGeradas}`);
        } else {
          console.log('📦 Sobras geradas NÃO foram cadastradas no estoque (configuração desativada)');
        }

        // ATUALIZAR STATUS das peças para 'otimizada' (não deletar)
        const updateStatusResponse = await projetoPecaService.updateStatus(
          selectedPieces.map(p => p.id),
          'otimizada',
          created.data.id
        );

        if (!updateStatusResponse.success) {
          throw new Error(updateStatusResponse.error || "Erro ao atualizar status das peças");
        }

        // Calcular estatísticas para mensagem
        const barrasNovas = resultWithLeftovers.bars.filter(b => b.type === 'new' || !b.type).length;
        const barrasSobras = resultWithLeftovers.bars.filter(b => b.type === 'leftover').length;

        // Montar mensagem de sucesso detalhada
        let mensagem = `Otimização criada! ${resultWithLeftovers.totalBars} barra(s), ${optimizationResult.efficiency.toFixed(1)}% eficiência`;
        if (barrasSobras > 0) {
          mensagem += `, ${barrasSobras} sobra(s) reutilizada(s)`;
        }
        if (sobrasGeradas > 0 && emendaConfig?.cadastrarSobrasGeradas !== false) {
          mensagem += `, ${sobrasGeradas} nova(s) sobra(s) cadastrada(s)`;
        }
        toast.success(mensagem);
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
