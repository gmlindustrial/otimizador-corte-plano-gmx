import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Upload,
  Calendar,
  Building,
  User,
  Package,
  Calculator,
  Settings,
  Scissors,
  Clock,
  Download,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { projetoPecaService } from "@/services/entities/ProjetoPecaService";
import { projetoOtimizacaoService } from "@/services/entities/ProjetoOtimizacaoService";
import { projetoChapaService } from "@/services/entities/ProjetoChapaService";
import { useQuery } from "@tanstack/react-query";
import { OptimizationCreateDialog } from "./OptimizationCreateDialog";
import { OptimizationResultsDialog } from "./OptimizationResultsDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import type {
  ProjetoPeca,
  ProjetoOtimizacao,
  ProjectPieceValidation,
  PerfilMaterial,
  ProjetoChapa,
} from "@/types/project";
import { PieceRegistrationForm } from "./PieceRegistrationForm";
import { FileUploadDialog } from "./FileUploadDialog";
import { ProjectValidationAlert } from "./ProjectValidationAlert";
import { ProjectDuplicateManager } from "./ProjectDuplicateManager";
import { DeleteConfirmDialog } from "../management/DeleteConfirmDialog";
import type { Project } from "@/pages/Index";
import { ProjectHistoryTab } from "./ProjectHistoryTab";
import { OptimizationReverseDialog } from "./OptimizationReverseDialog";
import { XlsxTemplateService } from "@/services/XlsxTemplateService";
import { perfilService } from "@/services/entities/PerfilService";
import { SheetValidationAlert, SheetValidation, groupByDescricao } from "./SheetValidationAlert";
import { SheetGroupCard } from "./SheetGroupCard";
import { SheetOptimizationDialog, SheetOptimizationConfig } from "./SheetOptimizationDialog";
import { SheetOptimizationResultsDialog } from "./SheetOptimizationResultsDialog";
import type { SheetInventorPiece } from "@/components/file-upload/FileParsingService";
import { materialService } from "@/services/entities/MaterialService";
import type { Material } from "@/services/interfaces";
import type { ProjetoChapaGroup } from "@/types/project";
import { sheetOptimizationService } from "@/services/SheetOptimizationService";
import { sheetHistoryService, type SheetOptimizationHistory } from "@/services/SheetHistoryService";
import type { SheetCutPiece, SheetProject, SheetOptimizationResult } from "@/types/sheet";

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

interface ProjectDetailsViewProps {
  project: Projeto;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateOptimization: (
    pieces: ProjetoPeca[],
    name: string,
    barLength: number
  ) => Promise<void>;
  onNavigateToProfileManagement?: () => void;
}

export const ProjectDetailsView = ({
  project,
  onBack,
  onEdit,
  onDelete,
  onCreateOptimization,
  onNavigateToProfileManagement,
}: ProjectDetailsViewProps) => {
  const [pieces, setPieces] = useState<ProjetoPeca[]>([]);
  const [optimizations, setOptimizations] = useState<ProjetoOtimizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [validations, setValidations] = useState<ProjectPieceValidation[]>([]);
  const [activeTab, setActiveTab] = useState<
    "pieces" | "register" | "optimizations" | "history" | "sheets"
  >("register");
  // Estado para chapas do projeto (persistidas no banco)
  const [projectChapas, setProjectChapas] = useState<ProjetoChapa[]>([]);
  const [chapaGroups, setChapaGroups] = useState<ProjetoChapaGroup[]>([]);
  const [sheetValidations, setSheetValidations] = useState<SheetValidation[]>([]);
  const [loadingChapas, setLoadingChapas] = useState(false);
  const [showSheetOptimizationDialog, setShowSheetOptimizationDialog] = useState(false);
  const [selectedChapaGroup, setSelectedChapaGroup] = useState<{
    group: ProjetoChapaGroup;
    chapas: ProjetoChapa[];
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [duplicateItems, setDuplicateItems] = useState<
    { existing: ProjetoPeca; imported: ProjetoPeca }[]
  >([]);
  const [selectedPieces, setSelectedPieces] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Estados para exclusão de chapas
  const [selectedChapas, setSelectedChapas] = useState<Set<string>>(new Set());
  const [confirmDeleteChapas, setConfirmDeleteChapas] = useState(false);
  const [deletingChapas, setDeletingChapas] = useState(false);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [viewResults, setViewResults] = useState<{
    res: any;
    bar: number;
    id: string;
    nome_lista: string;
  } | null>(null);
  const [reverseOptimization, setReverseOptimization] = useState<{
    id: string;
    nome_lista: string;
  } | null>(null);
  const [isOptimizingSheets, setIsOptimizingSheets] = useState(false);
  const [sheetOptimizationProgress, setSheetOptimizationProgress] = useState('');
  const [sheetOptimizationResults, setSheetOptimizationResults] = useState<{
    results: SheetOptimizationResult;
    project: SheetProject;
    name: string;
  } | null>(null);
  const [sheetOptimizations, setSheetOptimizations] = useState<SheetOptimizationHistory[]>([]);
  const [viewSheetOptimization, setViewSheetOptimization] = useState<SheetOptimizationHistory | null>(null);

  const mapProjetoToProject = (p: Projeto): Project => ({
    id: p.id,
    name: p.nome,
    projectNumber: p.numero_projeto,
    client: (p as any).clientes?.nome || "",
    obra: (p as any).obras?.nome || "",
    enviarSobrasEstoque: false,
    date: p.created_at,
    tipoMaterial: "",
    lista: "",
    revisao: "",
    turno: "",
    operador: "",
    aprovadorQA: "",
    validacaoQA: false,
    qrCode: "",
  });

  const projectForExport = mapProjetoToProject(project);

  // Buscar estatísticas do projeto usando o novo sistema de status
  const { data: projectStats } = useQuery({
    queryKey: ['project-statistics', project?.id],
    queryFn: async () => {
      if (!project?.id) return null;
      
      const response = await projetoPecaService.getStatistics(project.id);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar estatísticas');
      }
      
      return response.data;
    },
    enabled: !!project?.id
  });

  useEffect(() => {
    loadProjectData();
  }, [project.id]);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      // Carregar peças que estão aguardando otimização
      const piecesResponse = await projetoPecaService.getByStatus(
        project.id,
        'aguardando_otimizacao'
      );
      if (piecesResponse.success && piecesResponse.data) {
        setPieces(piecesResponse.data);
      }

      const optResponse = await projetoOtimizacaoService.getByProjectId(
        project.id
      );
      if (optResponse.success && optResponse.data) {
        setOptimizations(optResponse.data);
      }

      // Carregar otimizações de chapas
      const sheetOptHistory = await sheetHistoryService.getProjectHistory(project.id);
      setSheetOptimizations(sheetOptHistory);

      // Carregar chapas do projeto
      await loadProjectChapas();
    } catch (error) {
      console.error("Erro ao carregar dados do projeto:", error);
      toast.error("Erro ao carregar dados do projeto");
    } finally {
      setLoading(false);
    }
  };

  const loadProjectChapas = async () => {
    setLoadingChapas(true);
    try {
      // Carregar chapas individuais
      const chapasResponse = await projetoChapaService.getByProjectId(project.id);
      if (chapasResponse.success && chapasResponse.data) {
        setProjectChapas(chapasResponse.data);

        // Identificar chapas sem material para validação
        const chapasSemMaterial = chapasResponse.data.filter(c => c.material_nao_encontrado);
        if (chapasSemMaterial.length > 0) {
          // Agrupar por descrição para validação
          const grouped = groupByDescricao(chapasSemMaterial.map(c => ({
            id: c.id,
            tag: c.tag,
            posicao: c.posicao,
            width: c.largura_mm,
            height: c.altura_mm,
            thickness: c.espessura_mm,
            quantity: c.quantidade,
            material: c.material?.descricao || '',
            descricao: c.descricao || '',
            fase: c.fase,
            peso: c.peso
          })));
          setSheetValidations(grouped);
        } else {
          setSheetValidations([]);
        }
      }

      // Carregar grupos de chapas para otimização
      const groupsResponse = await projetoChapaService.getGroupedByEspessuraEMaterial(project.id);
      if (groupsResponse.success && groupsResponse.data) {
        setChapaGroups(groupsResponse.data);
      }
    } catch (error) {
      console.error("Erro ao carregar chapas do projeto:", error);
    } finally {
      setLoadingChapas(false);
    }
  };

  const handlePieceAdded = (piece: ProjetoPeca) => {
    setPieces((prev) => [...prev, piece]);
    setActiveTab("pieces");
  };

  const handleImportStart = () => {
    setImporting(true);
  };

  const handleFileProcessed = async (imported: any[]) => {
    const { allPieces, invalidPieces, stats } =
      await projetoPecaService.validateAndProcessPieces(imported, project.id);

    // Verificar duplicatas baseado na constraint única do banco:
    // projeto_id + tag + posicao + comprimento_mm + perfil_id
    const isDuplicate = (vp: ProjetoPeca, existing: ProjetoPeca) => {
      return (
        (vp.tag || '') === (existing.tag || '') &&
        vp.posicao === existing.posicao &&
        vp.comprimento_mm === existing.comprimento_mm &&
        (vp.perfil_id || '') === (existing.perfil_id || '')
      );
    };

    const duplicates = allPieces
      .filter((vp) => pieces.some((p) => isDuplicate(vp, p)))
      .map((vp) => ({
        existing: pieces.find((p) => isDuplicate(vp, p))!,
        imported: vp,
      }));

    const uniquePieces = allPieces.filter(
      (vp) => !pieces.some((p) => isDuplicate(vp, p))
    );

    if (uniquePieces.length > 0) {
      // Salvar TODAS as peças únicas (com e sem perfil)
      const resp = await projetoPecaService.createBatch(uniquePieces) as any;
      if (resp.success) {
        const insertedData = resp.data || [];
        const skippedCount = resp.skipped || 0;

        const withProfile = insertedData.filter(
          (p: any) => !p.perfil_nao_encontrado
        ).length;
        const withoutProfile = insertedData.filter(
          (p: any) => p.perfil_nao_encontrado
        ).length;

        // Construir mensagem
        let messageParts: string[] = [];

        if (withProfile > 0) {
          messageParts.push(`${withProfile} peça(s) cadastradas com perfil`);
        }
        if (withoutProfile > 0) {
          messageParts.push(`${withoutProfile} precisam ser revisadas`);
        }
        if (skippedCount > 0) {
          messageParts.push(`${skippedCount} já existiam`);
        }
        if (stats.invalidLength > 0) {
          messageParts.push(`${stats.invalidLength} descartadas por comprimento inválido`);
        }

        const message = messageParts.join(', ');

        if (insertedData.length === 0 && skippedCount > 0) {
          toast.info(`Todas as ${skippedCount} peça(s) já existem no projeto`);
        } else if (stats.invalidLength > 0 || skippedCount > 0) {
          toast.warning(message);
        } else if (withProfile > 0) {
          toast.success(message);
        } else {
          toast.warning(message);
        }

        await loadProjectData();
      } else {
        toast.error("Erro ao cadastrar peças: " + (resp.error || ""));
      }
    } else if (stats.invalidLength > 0) {
      toast.error(`${stats.invalidLength} peça(s) descartadas por comprimento inválido. Nenhuma peça foi importada.`);
    } else if (duplicates.length === 0) {
      toast.info("Nenhuma peça nova para importar");
    }

    if (duplicates.length > 0) {
      setDuplicateItems(duplicates);
      setActiveTab("register");
    }

    if (invalidPieces.length > 0) {
      setValidations(invalidPieces);
      toast.info("Algumas peças precisam ter seus perfis definidos");
      if (duplicates.length === 0) {
        setActiveTab("pieces"); // Ir para a aba de peças para mostrar as peças salvas
      }
    } else {
      setActiveTab("pieces");
    }

    // Fechar diálogo após processamento
    setShowUpload(false);
    setImporting(false);
  };

  const handleResolveValidation = async (
    validation: ProjectPieceValidation,
    perfil: PerfilMaterial
  ) => {
    // Buscar a peça existente na lista para atualizar
    const existingPiece = pieces.find(
      (p) => p.posicao === validation.peca.posicao
    );

    if (existingPiece) {
      // Atualizar peça existente
      const resp = await projetoPecaService.update(existingPiece.id, {
        perfil_id: perfil.id,
        peso_por_metro: perfil.kg_por_metro,
        perfil_nao_encontrado: false,
      });

      if (resp.success && resp.data) {
        // Atualizar na lista local
        setPieces((prev) =>
          prev.map((p) => (p.id === existingPiece.id ? resp.data : p))
        );
        setValidations((prev) =>
          prev.filter((v) => v.peca.posicao !== validation.peca.posicao)
        );
        toast.success(`Perfil definido para peça ${validation.peca.posicao}`);
      } else {
        toast.error("Erro ao atualizar peça");
      }
    } else {
      // Criar nova peça (fallback)
      const resp = await projetoPecaService.create({
        ...validation.peca,
        perfil_id: perfil.id,
        peso_por_metro: perfil.kg_por_metro,
        perfil_nao_encontrado: false,
      });
      if (resp.success && resp.data) {
        setPieces((prev) => [...prev, resp.data]);
        setValidations((prev) => prev.filter((v) => v !== validation));
        toast.success("Peça validada e cadastrada");
      } else {
        toast.error("Erro ao cadastrar peça");
      }
    }
  };

  const handleCreateAndResolve = async (
    descricaoRaw: string,
    perfilData: { tipo_perfil: string; descricao_perfil: string; kg_por_metro: number }
  ) => {
    // 1. Criar perfil no banco
    const resp = await perfilService.create(perfilData);
    if (!resp.success || !resp.data) {
      toast.error("Erro ao cadastrar perfil");
      return;
    }
    const novoPerfil: PerfilMaterial = resp.data;

    // 2. Encontrar TODAS as peças do projeto com a mesma descricao_perfil_raw
    const pecasParaAtualizar = pieces.filter(
      (p) => p.perfil_nao_encontrado && p.descricao_perfil_raw === descricaoRaw
    );

    // 3. Atualizar cada peça no banco
    for (const peca of pecasParaAtualizar) {
      await projetoPecaService.update(peca.id, {
        perfil_id: novoPerfil.id,
        peso_por_metro: novoPerfil.kg_por_metro,
        perfil_nao_encontrado: false,
      });
    }

    // 4. Atualizar estado local
    setPieces((prev) =>
      prev.map((p) =>
        pecasParaAtualizar.some((pa) => pa.id === p.id)
          ? {
              ...p,
              perfil_id: novoPerfil.id,
              perfil: novoPerfil,
              peso_por_metro: novoPerfil.kg_por_metro,
              perfil_nao_encontrado: false,
            }
          : p
      )
    );

    // 5. Remover validations das peças resolvidas
    setValidations((prev) =>
      prev.filter((v) => v.peca.descricao_perfil_raw !== descricaoRaw)
    );

    toast.success(
      `Perfil "${novoPerfil.descricao_perfil}" cadastrado e vinculado a ${pecasParaAtualizar.length} peça(s)`
    );
  };

  const handleDuplicateResolved = async (selected: ProjetoPeca[]) => {
    if (selected.length > 0) {
      const resp = await projetoPecaService.createBatch(selected);
      if (resp.success && resp.data) {
        toast.success(`${resp.data.length} peça(s) adicionadas`);
        await loadProjectData();
      } else {
        toast.error("Erro ao cadastrar peças");
      }
    }
    setDuplicateItems([]);
    setActiveTab("pieces");
  };

  // Handler para processar chapas importadas do Inventor
  const handleSheetPiecesProcessed = async (sheets: SheetInventorPiece[]) => {
    if (sheets.length === 0) return;

    console.log(`📋 Processando ${sheets.length} chapas do Inventor...`);

    try {
      // Validar e processar chapas, tentando vincular a materiais existentes
      const { chapas, chapasComMaterial, chapasSemMaterial } =
        await projetoChapaService.validateAndProcessChapas(sheets, project.id);

      // Salvar chapas no banco de dados
      const result = await projetoChapaService.createBatch(chapas);

      if (result.success) {
        const insertedCount = result.data?.length || 0;
        const skippedCount = (result as any).skipped || 0;

        // Construir mensagem
        let messageParts: string[] = [];
        if (insertedCount > 0) {
          messageParts.push(`${insertedCount} chapa(s) cadastradas`);
        }
        if (chapasComMaterial > 0) {
          messageParts.push(`${chapasComMaterial} com material`);
        }
        if (chapasSemMaterial > 0) {
          messageParts.push(`${chapasSemMaterial} precisam de material`);
        }
        if (skippedCount > 0) {
          messageParts.push(`${skippedCount} já existiam`);
        }

        const message = messageParts.join(', ');

        if (insertedCount === 0 && skippedCount > 0) {
          toast.info(`Todas as ${skippedCount} chapa(s) já existem no projeto`);
        } else if (chapasSemMaterial > 0) {
          toast.warning(message);
        } else {
          toast.success(message);
        }

        // Recarregar chapas do banco
        await loadProjectChapas();

        // Ir para aba de chapas
        setActiveTab("sheets");
      } else {
        toast.error("Erro ao cadastrar chapas: " + (result.error || ""));
      }
    } catch (error) {
      console.error("Erro ao processar chapas:", error);
      toast.error("Erro ao processar chapas");
    }
  };

  // Handler para resolver validação de material de chapa
  const handleResolveSheetValidation = async (validation: SheetValidation, material: Material) => {
    try {
      // Buscar IDs das chapas a atualizar
      const chapaIds = validation.pieces.map(p => p.id);

      // Atualizar no banco
      const result = await projetoChapaService.updateMaterialBatch(chapaIds, material.id);

      if (result.success) {
        // Recarregar chapas
        await loadProjectChapas();
        toast.success(`Material "${material.descricao}" vinculado a ${validation.pieces.length} chapa(s)`);
      } else {
        toast.error("Erro ao vincular material: " + (result.error || ""));
      }
    } catch (error) {
      console.error("Erro ao resolver validação de chapa:", error);
      toast.error("Erro ao vincular material");
    }
  };

  // Handler para criar novo material de chapa e vincular
  const handleCreateSheetMaterial = async (
    descricao: string,
    materialData: { tipo: string; descricao: string; comprimento_padrao: number; tipo_corte: 'chapa' }
  ) => {
    try {
      // Criar material no banco
      await materialService.criarMaterial(materialData);

      // Buscar o material criado
      const result = await materialService.getByTipoCorte('chapa');
      const novoMaterial = result.data?.find(m => m.descricao === materialData.descricao);

      if (novoMaterial) {
        // Buscar chapas com esta descrição que ainda não têm material
        const chapasParaAtualizar = projectChapas.filter(
          c => c.descricao === descricao && c.material_nao_encontrado
        );
        const chapaIds = chapasParaAtualizar.map(c => c.id);

        if (chapaIds.length > 0) {
          // Atualizar no banco
          const updateResult = await projetoChapaService.updateMaterialBatch(chapaIds, novoMaterial.id);

          if (updateResult.success) {
            // Recarregar chapas
            await loadProjectChapas();
            toast.success(`Material "${novoMaterial.descricao}" cadastrado e vinculado a ${chapaIds.length} chapa(s)`);
          } else {
            toast.error("Erro ao vincular material: " + (updateResult.error || ""));
          }
        } else {
          toast.success(`Material "${novoMaterial.descricao}" cadastrado`);
        }
      }
    } catch (error) {
      console.error('Erro ao criar material de chapa:', error);
      toast.error('Erro ao cadastrar material');
    }
  };

  // Handler para iniciar otimização de grupo de chapas
  const handleOptimizeChapaGroup = (group: ProjetoChapaGroup, selectedChapas: ProjetoChapa[]) => {
    setSelectedChapaGroup({ group, chapas: selectedChapas });
    setShowSheetOptimizationDialog(true);
  };

  // Handler para executar otimização de chapas
  const handleSheetOptimization = async (config: SheetOptimizationConfig) => {
    if (!selectedChapaGroup) return;

    const startTime = Date.now();
    setIsOptimizingSheets(true);
    setSheetOptimizationProgress('Preparando peças...');
    setShowSheetOptimizationDialog(false);

    try {
      console.log('Iniciando otimização de chapas:', config);
      console.log('Chapas selecionadas:', selectedChapaGroup.chapas);

      // 1. Converter ProjetoChapa para SheetCutPiece
      const pieces: SheetCutPiece[] = selectedChapaGroup.chapas.map(chapa => ({
        id: chapa.id,
        width: chapa.largura_mm,
        height: chapa.altura_mm,
        quantity: chapa.quantidade,
        tag: `${chapa.tag}-${chapa.posicao}`,
        allowRotation: config.allowRotation,
        thickness: chapa.espessura_mm,
        material: chapa.material?.descricao || chapa.descricao,
        geometry: {
          type: 'rectangle' as const,
          boundingBox: { width: chapa.largura_mm, height: chapa.altura_mm },
          area: chapa.largura_mm * chapa.altura_mm,
          perimeter: 2 * (chapa.largura_mm + chapa.altura_mm)
        }
      }));

      // 2. Criar projeto de otimização
      const sheetProject: SheetProject = {
        id: project.id,
        name: config.nomeOtimizacao,
        projectNumber: project.numero_projeto,
        sheetWidth: config.chapaEstoque.largura,
        sheetHeight: config.chapaEstoque.comprimento,
        thickness: selectedChapaGroup.group.espessura_mm || 6,
        kerf: config.kerf,
        process: config.processo,
        material: selectedChapaGroup.group.material?.descricao || 'A36'
      };

      // 3. Validar peças
      setSheetOptimizationProgress('Validando peças...');
      const validation = sheetOptimizationService.validatePieces(pieces, sheetProject);

      if (!validation.valid) {
        toast.error(`Erros de validação: ${validation.errors.join(', ')}`);
        setIsOptimizingSheets(false);
        return;
      }

      if (validation.warnings.length > 0) {
        validation.warnings.forEach(w => toast.warning(w));
      }

      // 4. Executar otimização
      setSheetOptimizationProgress(`Otimizando com algoritmo ${config.algorithm}...`);
      const result = await sheetOptimizationService.optimize(pieces, sheetProject);

      const optimizationTime = Date.now() - startTime;

      // 5. Salvar no histórico
      setSheetOptimizationProgress('Salvando resultado...');
      const historyId = await sheetHistoryService.saveOptimization(
        sheetProject,
        pieces,
        result,
        config.algorithm,
        optimizationTime
      );

      if (historyId) {
        // 6. Atualizar status das chapas no banco
        const chapaIds = selectedChapaGroup.chapas.map(c => c.id);
        await projetoChapaService.updateStatus(chapaIds, 'otimizada', historyId);

        // Mensagem de sucesso
        toast.success(
          `Otimização "${config.nomeOtimizacao}" concluída! ` +
          `${result.totalSheets} chapa(s) necessária(s), ` +
          `${result.averageEfficiency.toFixed(1)}% de aproveitamento`
        );

        // 7. Armazenar resultados para exibição no dialog
        setSheetOptimizationResults({
          results: result,
          project: sheetProject,
          name: config.nomeOtimizacao
        });
      } else {
        toast.warning('Otimização concluída, mas não foi possível salvar no histórico');
        // Mesmo assim, mostrar os resultados
        setSheetOptimizationResults({
          results: result,
          project: sheetProject,
          name: config.nomeOtimizacao
        });
      }

      // 8. Limpar seleção e recarregar dados
      setSelectedChapaGroup(null);
      await loadProjectChapas();

    } catch (error) {
      console.error('Erro ao otimizar chapas:', error);
      toast.error(`Erro na otimização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsOptimizingSheets(false);
      setSheetOptimizationProgress('');
    }
  };

  const handleReverseSheetOptimization = async (optimizationId: string, optimizationName: string) => {
    if (!confirm(`Tem certeza que deseja reverter a otimização "${optimizationName}"?\n\nAs chapas voltarão para a lista de aguardando otimização.`)) {
      return;
    }

    try {
      const result = await sheetHistoryService.reverseOptimization(optimizationId);

      if (result.success) {
        toast.success('Otimização revertida com sucesso. As chapas retornaram para a lista de aguardando otimização.');

        // Recarregar chapas do projeto
        await loadProjectChapas();

        // Recarregar histórico de otimizações de chapas
        const sheetOptHistory = await sheetHistoryService.getProjectHistory(project.id);
        setSheetOptimizations(sheetOptHistory);
      } else {
        toast.error('Erro ao reverter otimização: ' + (result.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao reverter otimização de chapas:', error);
      toast.error('Erro ao reverter otimização');
    }
  };

  const togglePieceSelection = (id: string) => {
    setSelectedPieces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleProfileSelection = (key: string, pieces: ProjetoPeca[]) => {
    const allSelected = pieces.every((p) => selectedPieces.has(p.id));
    setSelectedPieces((prev) => {
      const newSet = new Set(prev);
      pieces.forEach((p) => {
        if (allSelected) newSet.delete(p.id);
        else newSet.add(p.id);
      });
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    setDeleting(true);
    try {
      for (const id of selectedPieces) {
        await projetoPecaService.delete(id);
      }
      setSelectedPieces(new Set());
      await loadProjectData();
      toast.success("Peças excluídas");
    } catch (err) {
      toast.error("Erro ao excluir peças");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  // Handler para excluir chapas selecionadas
  const handleDeleteSelectedChapas = async () => {
    setDeletingChapas(true);
    try {
      for (const id of selectedChapas) {
        await projetoChapaService.delete(id);
      }
      setSelectedChapas(new Set());
      await loadProjectChapas();
      toast.success("Chapas excluídas com sucesso");
    } catch (err) {
      console.error("Erro ao excluir chapas:", err);
      toast.error("Erro ao excluir chapas");
    } finally {
      setDeletingChapas(false);
      setConfirmDeleteChapas(false);
    }
  };

  // Toggle seleção de chapa individual
  const toggleChapaSelection = (chapaId: string) => {
    setSelectedChapas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapaId)) {
        newSet.delete(chapaId);
      } else {
        newSet.add(chapaId);
      }
      return newSet;
    });
  };

  // Toggle seleção de todas as chapas
  const toggleAllChapasSelection = () => {
    setSelectedChapas(prev => {
      if (prev.size === projectChapas.length) {
        return new Set();
      } else {
        return new Set(projectChapas.map(c => c.id));
      }
    });
  };

  const groupedPieces = pieces.reduce((acc, piece) => {
    const key = piece.perfil_id || "sem_perfil";
    if (!acc[key]) {
      acc[key] = {
        perfil: piece.perfil,
        pieces: [],
        totalQuantity: 0,
        totalLength: 0,
        totalWeight: 0,
      };
    }
    acc[key].pieces.push(piece);
    acc[key].totalQuantity += piece.quantidade;
    acc[key].totalLength += piece.comprimento_mm * piece.quantidade;
    acc[key].totalWeight +=
      ((piece.peso_por_metro || 0) * piece.comprimento_mm * piece.quantidade) /
      1000;
    return acc;
  }, {} as Record<string, any>);

  // Estatísticas do Projeto
  const totalPiecesCount = pieces.reduce(
    (sum, p) => sum + (p.quantidade || 0),
    0
  );

  const optimizedPiecesCount = optimizations.reduce((acc, opt) => {
    const bars = opt?.resultados?.bars || [];
    return (
      acc +
      bars.reduce((sum: number, bar: any) => {
        const pcs = Array.isArray(bar?.pieces) ? bar.pieces : [];
        return sum + pcs.length;
      }, 0)
    );
  }, 0);
  const cutPiecesCount = optimizations.reduce((acc, opt) => {
    const bars = opt?.resultados?.bars || [];
    return (
      acc +
      bars.reduce((sum: number, b: any) => {
        const pcs = b?.pieces || [];
        return (
          sum +
          pcs.filter(
            (piece: any) =>
              piece?.cortada === true || piece?.status === "cortado"
          ).length
        );
      }, 0)
    );
  }, 0);

  const totalAllPieces = totalPiecesCount + optimizedPiecesCount;
  const optimizedPctOfTotal = totalAllPieces > 0 ? (optimizedPiecesCount / totalAllPieces) * 100 : 0;
  const cutPctOfTotal = totalAllPieces > 0 ? (cutPiecesCount / totalAllPieces) * 100 : 0;
  const cutPctOfOptimized = optimizedPiecesCount > 0 ? (cutPiecesCount / optimizedPiecesCount) * 100 : 0;
  const awaitingCutCount = Math.max(optimizedPiecesCount - cutPiecesCount, 0);
  const awaitingPctOfOptimized = optimizedPiecesCount > 0 ? (awaitingCutCount / optimizedPiecesCount) * 100 : 0;

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6">
          <div className="text-center">Carregando dados do projeto...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Loading overlay durante otimização de chapas */}
      {isOptimizingSheets && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-teal-200 rounded-full"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <Scissors className="absolute inset-0 m-auto w-8 h-8 text-teal-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800">Otimizando Chapas</h3>
                <p className="text-gray-600">{sheetOptimizationProgress}</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-gray-500">
                Por favor, aguarde enquanto processamos a otimização...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Header */}
        <Card className="bg-white/95 backdrop-blur-lg shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <Button
                  onClick={onBack}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 text-white border-white/30 hover:bg-white hover:text-indigo-600 transition-all duration-300 w-fit backdrop-blur-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    {project.nome}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-white/90">
                    <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                      {project.numero_projeto}
                    </span>
                    <span>•</span>
                    <span>{project.clientes?.nome}</span>
                    <span>•</span>
                    <span>{project.obras?.nome}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={onEdit}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 text-white border-white/30 hover:bg-white hover:text-indigo-600 transition-all duration-300 backdrop-blur-sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  onClick={onDelete}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 text-white border-white/30 hover:bg-white hover:text-red-600 transition-all duration-300 backdrop-blur-sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Project Info */}
        <Card className="bg-white/95 backdrop-blur-lg shadow-xl border-0 rounded-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              Informações do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                      Cliente
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {project.clientes?.nome || "Não definido"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                    <Building className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-emerald-600 uppercase tracking-wide">
                      Obra
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {project.obras?.nome || "Não definida"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors">
                    <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-600 uppercase tracking-wide">
                      Criado em
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {format(new Date(project.created_at), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-6">
              {/* Total de Peças */}
              <div className="group p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-violet-100 rounded-xl group-hover:bg-violet-200 transition-colors">
                    <Package className="w-6 h-6 text-violet-600" />
                  </div>
                  <div className="space-y-1 w-full">
                    <p className="text-sm font-medium text-violet-600 uppercase tracking-wide">
                      Total de Peças
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {projectStats?.total || 0}
                    </p>
                    <div className="mt-3 space-y-1">
                      <div className="text-xs text-gray-600">100% do total</div>
                      <Progress value={100} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Peças Aguardando Otimização */}
              <div className="group p-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition-colors">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="space-y-1 w-full">
                    <p className="text-sm font-medium text-yellow-600 uppercase tracking-wide">
                      Aguardando Otimização
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {projectStats?.aguardandoOtimizacao || 0}
                    </p>
                    <div className="mt-3 space-y-1">
                      <div className="text-xs text-gray-600">
                        {projectStats?.total > 0 ? ((projectStats.aguardandoOtimizacao / projectStats.total) * 100).toFixed(1) : 0}% do total
                      </div>
                      <Progress 
                        value={projectStats?.total > 0 ? (projectStats.aguardandoOtimizacao / projectStats.total) * 100 : 0} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Peças Otimizadas (Aguardando Corte) */}
              <div className="group p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-100 rounded-xl group-hover:bg-cyan-200 transition-colors">
                    <Calculator className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div className="space-y-1 w-full">
                    <p className="text-sm font-medium text-cyan-600 uppercase tracking-wide">
                      Aguardando Corte
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {projectStats?.otimizadas || 0}
                    </p>
                    <div className="mt-3 space-y-1">
                      <div className="text-xs text-gray-600">
                        {projectStats?.total > 0 ? ((projectStats.otimizadas / projectStats.total) * 100).toFixed(1) : 0}% do total
                      </div>
                      <Progress 
                        value={projectStats?.total > 0 ? (projectStats.otimizadas / projectStats.total) * 100 : 0} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Peças Cortadas */}
              <div className="group p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                    <Scissors className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="space-y-1 w-full">
                    <p className="text-sm font-medium text-emerald-600 uppercase tracking-wide">
                      Peças Cortadas
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {projectStats?.cortadas || 0}
                    </p>
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">
                          Do total: {projectStats?.total > 0 ? ((projectStats.cortadas / projectStats.total) * 100).toFixed(1) : 0}%
                        </div>
                        <Progress 
                          value={projectStats?.total > 0 ? (projectStats.cortadas / projectStats.total) * 100 : 0} 
                        />
                      </div>
                      {projectStats?.otimizadas > 0 && (
                        <div>
                          <div className="text-xs text-gray-600 mb-1">
                            Das otimizadas: {((projectStats.cortadas / projectStats.otimizadas) * 100).toFixed(1)}%
                          </div>
                          <Progress 
                            value={(projectStats.cortadas / projectStats.otimizadas) * 100} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(
              value as "pieces" | "optimizations" | "register" | "history" | "sheets"
            )
          }
          className="space-y-8"
        >
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg border-0">
            <TabsTrigger
              value="register"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Peça
            </TabsTrigger>
            <TabsTrigger
              value="pieces"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Package className="w-4 h-4" />
              Peças ({totalPiecesCount})
              {pieces.filter((p) => p.perfil_nao_encontrado).length > 0 && (
                <Badge
                  variant="destructive"
                  className="text-xs px-1 py-0 h-4 min-w-4 bg-orange-500 hover:bg-orange-600"
                >
                  {pieces.filter((p) => p.perfil_nao_encontrado).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="sheets"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Scissors className="w-4 h-4" />
              Chapas ({projectChapas.length})
              {sheetValidations.length > 0 && (
                <Badge
                  variant="destructive"
                  className="text-xs px-1 py-0 h-4 min-w-4 bg-orange-500 hover:bg-orange-600"
                >
                  {sheetValidations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="optimizations"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Calculator className="w-4 h-4" />
              Otimizações ({optimizations.length + sheetOptimizations.length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Calendar className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card className="bg-white/95 backdrop-blur-lg shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  Cadastrar Nova Peça
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Botões de importação destacados no topo */}
                <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <Button
                    onClick={() => setShowUpload(true)}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Importar Arquivo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await XlsxTemplateService.downloadTemplate();
                        toast.success('Modelo de importação baixado com sucesso');
                      } catch (error) {
                        console.error('Erro ao baixar modelo:', error);
                        toast.error('Erro ao baixar modelo de importação');
                      }
                    }}
                    className="flex-1 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Baixar Modelo XLSX
                  </Button>
                </div>

                {importing ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-600 font-medium">
                        Extraindo peças do arquivo...
                      </p>
                    </div>
                  </div>
                ) : duplicateItems.length > 0 ? (
                  <ProjectDuplicateManager
                    duplicates={duplicateItems}
                    onResolved={handleDuplicateResolved}
                    onCancel={() => setDuplicateItems([])}
                  />
                ) : (
                  <>
                    <PieceRegistrationForm
                      projectId={project.id}
                      onPieceAdded={handlePieceAdded}
                    />
                    {validations.length > 0 && (
                      <div className="mt-6">
                        <ProjectValidationAlert
                          validations={validations}
                          onResolve={handleResolveValidation}
                          onCreateAndResolve={handleCreateAndResolve}
                          onNavigateToProfileManagement={
                            onNavigateToProfileManagement
                          }
                        />
                      </div>
                    )}
                    <FileUploadDialog
                      open={showUpload}
                      onOpenChange={setShowUpload}
                      onProcessStart={handleImportStart}
                      onFileProcessed={handleFileProcessed}
                      onSheetPiecesProcessed={handleSheetPiecesProcessed}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pieces">
            <Card className="bg-white/95 backdrop-blur-lg shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  Peças do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieces.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">
                      Nenhuma peça cadastrada neste projeto.
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue="grouped" className="space-y-4">
                    <TabsList className="bg-gray-100 p-1 rounded-lg">
                      <TabsTrigger
                        value="grouped"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Otimizar por Perfil
                      </TabsTrigger>
                      <TabsTrigger
                        value="list"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Lista Completa
                      </TabsTrigger>
                    </TabsList>

                    {/* Aba de Otimização por Perfil */}
                    <TabsContent value="grouped" className="space-y-4">
                      {selectedPieces.size > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <span className="text-sm text-red-700 font-medium">
                            {selectedPieces.size} peça(s) selecionada(s)
                          </span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setConfirmDelete(true)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Selecionadas ({selectedPieces.size})
                          </Button>
                        </div>
                      )}
                      <Accordion type="multiple" className="space-y-4">
                        {Object.entries(groupedPieces).map(([key, group]) => {
                          const allSelected = group.pieces.every((p: ProjetoPeca) =>
                            selectedPieces.has(p.id)
                          );
                          const someSelected = group.pieces.some((p: ProjetoPeca) =>
                            selectedPieces.has(p.id)
                          );
                          const canOptimizeGroup = group.perfil && someSelected;
                          return (
                            <AccordionItem
                              key={key}
                              value={key}
                              className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                            >
                              <AccordionTrigger className="hover:no-underline px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300">
                                <div className="flex items-center gap-4 flex-1">
                                  <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={() =>
                                      toggleProfileSelection(key, group.pieces)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="scale-110"
                                  />
                                  <div className="flex-1">
                                    <span className="font-semibold text-gray-800 text-lg">
                                      {group.perfil?.descricao_perfil ||
                                        "Perfil não definido"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge
                                      variant="secondary"
                                      className="bg-indigo-100 text-indigo-800 px-3 py-1"
                                    >
                                      {group.totalQuantity} peças
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="border-purple-200 text-purple-700 px-3 py-1"
                                    >
                                      {(group.totalLength / 1000).toFixed(2)}m
                                    </Badge>
                                    {group.totalWeight > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="border-emerald-200 text-emerald-700 px-3 py-1"
                                      >
                                        {group.totalWeight.toFixed(2)}kg
                                      </Badge>
                                    )}
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowOptimizationDialog(true);
                                      }}
                                      disabled={!canOptimizeGroup}
                                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 ml-2"
                                    >
                                      <Calculator className="w-4 h-4 mr-1" />
                                      Otimizar
                                    </Button>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 py-4 bg-white">
                                <div className="space-y-3">
                                  {group.pieces.map((piece: ProjetoPeca) => {
                                    const selected = selectedPieces.has(piece.id);
                                    const peso = piece.peso_por_metro
                                      ? (piece.peso_por_metro *
                                          piece.comprimento_mm) /
                                        1000
                                      : null;
                                    return (
                                      <div
                                        key={piece.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border hover:shadow-sm transition-all duration-300 ${
                                          piece.perfil_nao_encontrado
                                            ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200"
                                            : selected
                                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                                            : "bg-gradient-to-r from-gray-50 to-white border-gray-100"
                                        }`}
                                      >
                                        <div className="flex items-start gap-4">
                                          <Checkbox
                                            checked={selected}
                                            onCheckedChange={() =>
                                              togglePieceSelection(piece.id)
                                            }
                                            className="mt-1 scale-110"
                                          />
                                          <div className="space-y-2">
                                            {piece.perfil ? (
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-600">
                                                  Perfil:
                                                </span>
                                                <span className="text-sm text-gray-800 bg-blue-50 px-2 py-1 rounded">
                                                  {piece.perfil.descricao_perfil}
                                                </span>
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-orange-600">
                                                  Perfil:
                                                </span>
                                                <span className="text-sm text-orange-800 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                                  {piece.descricao_perfil_raw ||
                                                    "Não definido"}
                                                </span>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => {
                                                    const validation: ProjectPieceValidation =
                                                      {
                                                        peca: piece,
                                                        isValid: false,
                                                        suggestions: [],
                                                      };
                                                    setValidations((prev) => {
                                                      const exists = prev.some(
                                                        (v) =>
                                                          v.peca.posicao ===
                                                          piece.posicao
                                                      );
                                                      if (!exists) {
                                                        return [
                                                          ...prev,
                                                          validation,
                                                        ];
                                                      }
                                                      return prev;
                                                    });
                                                    setActiveTab("register");
                                                  }}
                                                  className="ml-2 text-xs px-2 py-1 h-6 bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200"
                                                >
                                                  Definir Perfil
                                                </Button>
                                              </div>
                                            )}
                                            <div className="flex items-center gap-4">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-600">
                                                  Posição:
                                                </span>
                                                <span className="text-sm text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">
                                                  {piece.posicao}
                                                </span>
                                              </div>
                                              {piece.tag && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-semibold text-gray-600">
                                                    TAG:
                                                  </span>
                                                  <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-medium">
                                                    {piece.tag}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-600">
                                                  Comprimento:
                                                </span>
                                                <span className="text-sm text-gray-800 bg-emerald-50 px-2 py-1 rounded">
                                                  {piece.comprimento_mm}mm
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-600">
                                                  Qtd:
                                                </span>
                                                <span className="text-sm text-gray-800 bg-purple-50 px-2 py-1 rounded">
                                                  {piece.quantidade}
                                                </span>
                                              </div>
                                              {peso !== null && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-semibold text-gray-600">
                                                    Peso:
                                                  </span>
                                                  <span className="text-sm text-gray-800 bg-amber-50 px-2 py-1 rounded">
                                                    {peso.toFixed(2)}kg
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedPieces(new Set([piece.id]));
                                            setConfirmDelete(true);
                                          }}
                                          className="text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </TabsContent>

                    {/* Aba de Lista Completa */}
                    <TabsContent value="list" className="space-y-4">
                      {/* Botão de excluir selecionadas */}
                      {selectedPieces.size > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <span className="text-sm text-red-700 font-medium">
                            {selectedPieces.size} peça(s) selecionada(s)
                          </span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setConfirmDelete(true)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Selecionadas ({selectedPieces.size})
                          </Button>
                        </div>
                      )}

                      {/* Tabela de peças */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <th className="py-3 px-4 w-10">
                                <Checkbox
                                  checked={pieces.length > 0 && selectedPieces.size === pieces.length}
                                  onCheckedChange={() => {
                                    if (selectedPieces.size === pieces.length) {
                                      setSelectedPieces(new Set());
                                    } else {
                                      setSelectedPieces(new Set(pieces.map(p => p.id)));
                                    }
                                  }}
                                />
                              </th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Tag</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Posição</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Perfil</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Comprimento</th>
                              <th className="text-center py-3 px-4 font-semibold text-gray-700">Qtd</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Peso</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                              <th className="text-center py-3 px-4 font-semibold text-gray-700">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pieces.map((piece) => {
                              const isSelected = selectedPieces.has(piece.id);
                              const hasMaterialIssue = piece.perfil_nao_encontrado;
                              const peso = piece.peso_por_metro
                                ? (piece.peso_por_metro * piece.comprimento_mm) / 1000
                                : null;
                              return (
                                <tr
                                  key={piece.id}
                                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                    hasMaterialIssue ? 'bg-orange-50' : isSelected ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <td className="py-3 px-4">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => togglePieceSelection(piece.id)}
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    {piece.tag ? (
                                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-medium">
                                        {piece.tag}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-gray-700">
                                    {piece.posicao}
                                  </td>
                                  <td className="py-3 px-4">
                                    {hasMaterialIssue ? (
                                      <span className="text-orange-600 flex items-center gap-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        {piece.descricao_perfil_raw || 'Não definido'}
                                      </span>
                                    ) : (
                                      <span className="text-gray-700">{piece.perfil?.descricao_perfil || '-'}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                                      {piece.comprimento_mm} mm
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                                      {piece.quantidade}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    {peso !== null ? (
                                      <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded">
                                        {peso.toFixed(2)} kg
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge
                                      variant="outline"
                                      className={
                                        piece.status === 'aguardando_otimizacao'
                                          ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                                          : piece.status === 'otimizada'
                                          ? 'border-blue-200 text-blue-700 bg-blue-50'
                                          : 'border-green-200 text-green-700 bg-green-50'
                                      }
                                    >
                                      {piece.status === 'aguardando_otimizacao'
                                        ? 'Aguardando'
                                        : piece.status === 'otimizada'
                                        ? 'Otimizada'
                                        : 'Cortada'}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedPieces(new Set([piece.id]));
                                        setConfirmDelete(true);
                                      }}
                                      className="text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Resumo */}
                      <div className="flex gap-4 pt-4 border-t border-gray-200">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-lg border border-blue-100">
                          <span className="text-sm text-blue-600 font-medium">Total de peças: </span>
                          <span className="text-lg font-bold text-blue-800">{pieces.length}</span>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 rounded-lg border border-purple-100">
                          <span className="text-sm text-purple-600 font-medium">Quantidade total: </span>
                          <span className="text-lg font-bold text-purple-800">
                            {pieces.reduce((sum, p) => sum + p.quantidade, 0)}
                          </span>
                        </div>
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 rounded-lg border border-emerald-100">
                          <span className="text-sm text-emerald-600 font-medium">Comprimento total: </span>
                          <span className="text-lg font-bold text-emerald-800">
                            {(pieces.reduce((sum, p) => sum + p.comprimento_mm * p.quantidade, 0) / 1000).toFixed(2)}m
                          </span>
                        </div>
                        {pieces.filter(p => p.perfil_nao_encontrado).length > 0 && (
                          <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 rounded-lg border border-orange-100">
                            <span className="text-sm text-orange-600 font-medium">Sem perfil: </span>
                            <span className="text-lg font-bold text-orange-800">
                              {pieces.filter(p => p.perfil_nao_encontrado).length}
                            </span>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sheets">
            <Card className="bg-white/95 backdrop-blur-lg shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                  <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
                    <Scissors className="w-5 h-5 text-white" />
                  </div>
                  Chapas do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Alerta de validação para chapas sem material */}
                {sheetValidations.length > 0 && (
                  <div className="mb-6">
                    <SheetValidationAlert
                      validations={sheetValidations}
                      onResolve={handleResolveSheetValidation}
                      onCreateAndResolve={handleCreateSheetMaterial}
                    />
                  </div>
                )}

                {loadingChapas ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-600 font-medium">Carregando chapas...</p>
                    </div>
                  </div>
                ) : projectChapas.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <Scissors className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">
                      Nenhuma chapa cadastrada neste projeto.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Importe um arquivo do Inventor que contenha chapas.
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue="optimize" className="space-y-4">
                    <TabsList className="bg-gray-100 p-1 rounded-lg">
                      <TabsTrigger
                        value="optimize"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Otimizar por Grupo
                      </TabsTrigger>
                      <TabsTrigger
                        value="list"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Lista Completa
                      </TabsTrigger>
                    </TabsList>

                    {/* Aba de Otimização por Grupo */}
                    <TabsContent value="optimize" className="space-y-4">
                      <SheetGroupCard
                        groups={chapaGroups}
                        onOptimizeGroup={handleOptimizeChapaGroup}
                        loading={loadingChapas}
                      />
                    </TabsContent>

                    {/* Aba de Lista Completa */}
                    <TabsContent value="list" className="space-y-4">
                      {/* Botão de excluir selecionadas */}
                      {selectedChapas.size > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <span className="text-sm text-red-700 font-medium">
                            {selectedChapas.size} chapa(s) selecionada(s)
                          </span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setConfirmDeleteChapas(true)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Selecionadas ({selectedChapas.size})
                          </Button>
                        </div>
                      )}

                      {/* Tabela de chapas */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <th className="py-3 px-4 w-10">
                                <Checkbox
                                  checked={projectChapas.length > 0 && selectedChapas.size === projectChapas.length}
                                  onCheckedChange={toggleAllChapasSelection}
                                />
                              </th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Tag</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Posição</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Descrição</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Dimensões</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Espessura</th>
                              <th className="text-center py-3 px-4 font-semibold text-gray-700">Qtd</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Material</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                              <th className="text-center py-3 px-4 font-semibold text-gray-700">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projectChapas.map((chapa) => {
                              const hasMaterialIssue = chapa.material_nao_encontrado;
                              const isSelected = selectedChapas.has(chapa.id);
                              return (
                                <tr
                                  key={chapa.id}
                                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                    hasMaterialIssue ? 'bg-orange-50' : isSelected ? 'bg-teal-50' : ''
                                  }`}
                                >
                                  <td className="py-3 px-4">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleChapaSelection(chapa.id)}
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-medium">
                                      {chapa.tag}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-gray-700">
                                    {chapa.posicao}
                                  </td>
                                  <td className="py-3 px-4 text-gray-800">
                                    {chapa.descricao}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                                      {chapa.largura_mm} × {chapa.altura_mm} mm
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    {chapa.espessura_mm ? (
                                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                        {chapa.espessura_mm} mm
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                                      {chapa.quantidade}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    {hasMaterialIssue ? (
                                      <span className="text-orange-600 flex items-center gap-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        Não cadastrado
                                      </span>
                                    ) : (
                                      <span className="text-gray-700">{chapa.material?.descricao || '-'}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge
                                      variant="outline"
                                      className={
                                        chapa.status === 'aguardando_otimizacao'
                                          ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                                          : chapa.status === 'otimizada'
                                          ? 'border-blue-200 text-blue-700 bg-blue-50'
                                          : 'border-green-200 text-green-700 bg-green-50'
                                      }
                                    >
                                      {chapa.status === 'aguardando_otimizacao'
                                        ? 'Aguardando'
                                        : chapa.status === 'otimizada'
                                        ? 'Otimizada'
                                        : 'Cortada'}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedChapas(new Set([chapa.id]));
                                        setConfirmDeleteChapas(true);
                                      }}
                                      className="text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Resumo */}
                      <div className="flex gap-4 pt-4 border-t border-gray-200">
                        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-3 rounded-lg border border-teal-100">
                          <span className="text-sm text-teal-600 font-medium">Total de chapas: </span>
                          <span className="text-lg font-bold text-teal-800">{projectChapas.length}</span>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 rounded-lg border border-purple-100">
                          <span className="text-sm text-purple-600 font-medium">Quantidade total: </span>
                          <span className="text-lg font-bold text-purple-800">
                            {projectChapas.reduce((sum, c) => sum + c.quantidade, 0)}
                          </span>
                        </div>
                        {projectChapas.filter(c => c.material_nao_encontrado).length > 0 && (
                          <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 rounded-lg border border-orange-100">
                            <span className="text-sm text-orange-600 font-medium">Sem material: </span>
                            <span className="text-lg font-bold text-orange-800">
                              {projectChapas.filter(c => c.material_nao_encontrado).length}
                            </span>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimizations">
            <Card className="bg-white/95 backdrop-blur-lg shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  Histórico de Otimizações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {optimizations.length === 0 && sheetOptimizations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <Calculator className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">
                      Nenhuma otimização realizada para este projeto.
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue="bars" className="space-y-4">
                    <TabsList className="bg-gray-100 p-1 rounded-lg">
                      <TabsTrigger
                        value="bars"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Barras ({optimizations.length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="sheets"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                      >
                        <Scissors className="w-4 h-4 mr-2" />
                        Chapas ({sheetOptimizations.length})
                      </TabsTrigger>
                    </TabsList>

                    {/* Otimizações de Barras */}
                    <TabsContent value="bars" className="space-y-4">
                      {optimizations.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500">
                            Nenhuma otimização de barras realizada.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {optimizations.map((optimization) => {
                            const totalPieces =
                              optimization.resultados?.bars?.reduce(
                                (sum: number, b: any) => sum + b.pieces.length,
                                0
                              ) || 0;
                            const cutPieces =
                              optimization.resultados?.bars?.reduce(
                                (sum: number, b: any) =>
                                  sum + b.pieces.filter((p: any) => p.cortada).length,
                                0
                              ) || 0;
                            const percent =
                              totalPieces > 0
                                ? Math.round((cutPieces / totalPieces) * 100)
                                : 0;

                            return (
                              <Card
                                key={optimization.id}
                                className="border border-gray-200 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden"
                              >
                                <CardContent className="p-6">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <Badge className="bg-indigo-100 text-indigo-800">
                                          <Package className="w-3 h-3 mr-1" />
                                          Barras
                                        </Badge>
                                        <h4 className="text-lg font-semibold text-gray-800">
                                          {optimization.nome_lista}
                                        </h4>
                                      </div>
                                      <div className="flex gap-4">
                                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                          Barra: {optimization.tamanho_barra}mm
                                        </span>
                                        <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                                          {cutPieces}/{totalPieces} peças ({percent}%)
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-500">
                                        {format(
                                          new Date(optimization.created_at),
                                          "dd/MM/yyyy HH:mm"
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() =>
                                          setViewResults({
                                            res: optimization.resultados,
                                            bar: optimization.tamanho_barra,
                                            id: optimization.id,
                                            nome_lista: optimization.nome_lista,
                                          })
                                        }
                                        className="hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300"
                                      >
                                        Visualizar Resultados
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() =>
                                          setReverseOptimization({
                                            id: optimization.id,
                                            nome_lista: optimization.nome_lista,
                                          })
                                        }
                                        className="text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300"
                                      >
                                        Reverter
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    {/* Otimizações de Chapas */}
                    <TabsContent value="sheets" className="space-y-4">
                      {sheetOptimizations.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                            <Scissors className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500">
                            Nenhuma otimização de chapas realizada.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sheetOptimizations.map((optimization) => (
                            <Card
                              key={optimization.id}
                              className="border border-gray-200 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden"
                            >
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <Badge className="bg-teal-100 text-teal-800">
                                        <Scissors className="w-3 h-3 mr-1" />
                                        Chapas
                                      </Badge>
                                      <h4 className="text-lg font-semibold text-gray-800">
                                        {optimization.project_name}
                                      </h4>
                                    </div>
                                    <div className="flex gap-4 flex-wrap">
                                      <span className="text-sm bg-teal-100 text-teal-800 px-3 py-1 rounded-full font-medium">
                                        {optimization.total_sheets} chapa(s)
                                      </span>
                                      <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                                        {optimization.efficiency.toFixed(1)}% eficiência
                                      </span>
                                      <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                                        {optimization.total_weight.toFixed(1)} kg
                                      </span>
                                      <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                        {optimization.algorithm}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      {format(
                                        new Date(optimization.created_at),
                                        "dd/MM/yyyy HH:mm"
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setViewSheetOptimization(optimization)}
                                      className="hover:bg-teal-50 hover:border-teal-300 transition-all duration-300"
                                    >
                                      Visualizar Resultados
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleReverseSheetOptimization(optimization.id, optimization.project_name)}
                                      className="text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300"
                                    >
                                      Reverter
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <ProjectHistoryTab
              projectId={project.id}
              projectName={project.nome}
            />
          </TabsContent>
        </Tabs>

        <OptimizationCreateDialog
          open={showOptimizationDialog}
          onOpenChange={setShowOptimizationDialog}
          onCreate={(name, bar) =>
            onCreateOptimization(
              pieces.filter((p) => selectedPieces.has(p.id)),
              name,
              bar
            ).then(() => {
              setShowOptimizationDialog(false);
              setActiveTab("optimizations");
              void loadProjectData();
            })
          }
          selectedPieces={pieces.filter((p) => selectedPieces.has(p.id))}
          projectId={project?.id}
          onNavigateToProfileManagement={onNavigateToProfileManagement}
        />
        <OptimizationResultsDialog
          open={!!viewResults}
          onOpenChange={() => setViewResults(null)}
          results={viewResults?.res || null}
          barLength={viewResults?.bar || 0}
          project={projectForExport}
          optimizationId={viewResults?.id || null}
          listName={viewResults?.nome_lista}
        />
        <DeleteConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          onConfirm={handleDeleteSelected}
          title="Excluir Peças"
          description={`Tem certeza que deseja excluir ${selectedPieces.size} peça(s)? Esta ação não pode ser desfeita.`}
          loading={deleting}
        />
        <DeleteConfirmDialog
          open={confirmDeleteChapas}
          onOpenChange={setConfirmDeleteChapas}
          onConfirm={handleDeleteSelectedChapas}
          title="Excluir Chapas"
          description={`Tem certeza que deseja excluir ${selectedChapas.size} chapa(s)? Esta ação não pode ser desfeita.`}
          loading={deletingChapas}
        />
        <OptimizationReverseDialog
          open={!!reverseOptimization}
          onOpenChange={() => setReverseOptimization(null)}
          optimization={reverseOptimization}
          onReversed={() => {
            loadProjectData();
            setReverseOptimization(null);
          }}
        />
        <SheetOptimizationDialog
          open={showSheetOptimizationDialog}
          onOpenChange={setShowSheetOptimizationDialog}
          group={selectedChapaGroup?.group || null}
          selectedChapas={selectedChapaGroup?.chapas || []}
          onOptimize={handleSheetOptimization}
        />
        <SheetOptimizationResultsDialog
          open={!!sheetOptimizationResults}
          onOpenChange={(open) => {
            if (!open) setSheetOptimizationResults(null);
          }}
          results={sheetOptimizationResults?.results || null}
          project={sheetOptimizationResults?.project || null}
          optimizationName={sheetOptimizationResults?.name || ''}
        />
        {/* Dialog para visualizar otimização de chapas do histórico */}
        <SheetOptimizationResultsDialog
          open={!!viewSheetOptimization}
          onOpenChange={(open) => {
            if (!open) setViewSheetOptimization(null);
          }}
          results={viewSheetOptimization?.results || null}
          project={viewSheetOptimization ? {
            id: viewSheetOptimization.project_id,
            name: viewSheetOptimization.project_name,
            projectNumber: project.numero_projeto,
            sheetWidth: viewSheetOptimization.sheet_width || 2500,
            sheetHeight: viewSheetOptimization.sheet_height || 6000,
            thickness: 6,
            kerf: 3,
            process: 'plasma',
            material: 'A36'
          } : null}
          optimizationName={viewSheetOptimization?.project_name || ''}
        />
      </div>
    </div>
  );
};
