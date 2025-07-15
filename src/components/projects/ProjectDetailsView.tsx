import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Settings
} from 'lucide-react';
import { projetoPecaService } from '@/services/entities/ProjetoPecaService';
import { projetoOtimizacaoService } from '@/services/entities/ProjetoOtimizacaoService';
import { OptimizationCreateDialog } from './OptimizationCreateDialog';
import { OptimizationResultsDialog } from './OptimizationResultsDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { ProjetoPeca, ProjetoOtimizacao, ProjectPieceValidation, PerfilMaterial } from '@/types/project';
import { PieceRegistrationForm } from './PieceRegistrationForm';
import { FileUploadDialog } from './FileUploadDialog';
import { ProjectValidationAlert } from './ProjectValidationAlert';
import { ProjectDuplicateManager } from './ProjectDuplicateManager';
import { DeleteConfirmDialog } from '../management/DeleteConfirmDialog';

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
  onNavigateToProfileManagement
}: ProjectDetailsViewProps) => {
  const [pieces, setPieces] = useState<ProjetoPeca[]>([]);
  const [optimizations, setOptimizations] = useState<ProjetoOtimizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [validations, setValidations] = useState<ProjectPieceValidation[]>([]);
  const [activeTab, setActiveTab] = useState<'pieces' | 'register' | 'optimizations'>('pieces');
  const [importing, setImporting] = useState(false);
  const [duplicateItems, setDuplicateItems] = useState<{ existing: ProjetoPeca; imported: ProjetoPeca }[]>([]);
  const [selectedPieces, setSelectedPieces] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [viewResults, setViewResults] = useState<{ res: any; bar: number; id: string } | null>(null);

  useEffect(() => {
    loadProjectData();
  }, [project.id]);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      // Carregar peças
      const piecesResponse = await projetoPecaService.getByProjectId(project.id);
      if (piecesResponse.success && piecesResponse.data) {
        setPieces(piecesResponse.data);
      }

      const optResponse = await projetoOtimizacaoService.getByProjectId(project.id);
      if (optResponse.success && optResponse.data) {
        setOptimizations(optResponse.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do projeto:', error);
      toast.error('Erro ao carregar dados do projeto');
    } finally {
      setLoading(false);
    }
  };

  const handlePieceAdded = (piece: ProjetoPeca) => {
    setPieces(prev => [...prev, piece]);
    setActiveTab('pieces');
  };

  const handleImportStart = () => {
    setImporting(true);
  };

  const handleFileProcessed = async (imported: any[]) => {
    const { validPieces, invalidPieces } =
      await projetoPecaService.validateAndProcessPieces(imported, project.id);

    const duplicates = validPieces.filter((vp) =>
      pieces.some((p) => p.posicao === vp.posicao)
    ).map((vp) => ({ existing: pieces.find(p => p.posicao === vp.posicao)!, imported: vp }));

    const uniqueValid = validPieces.filter(
      (vp) => !pieces.some((p) => p.posicao === vp.posicao)
    );

    if (uniqueValid.length > 0) {
      const resp = await projetoPecaService.createBatch(uniqueValid);
      if (resp.success && resp.data) {
        toast.success(`${resp.data.length} peça(s) cadastradas`);
        await loadProjectData();
      } else {
        toast.error('Erro ao cadastrar peças');
      }
    }

    if (duplicates.length > 0) {
      setDuplicateItems(duplicates);
      setActiveTab('register');
    }

    if (invalidPieces.length > 0) {
      setValidations(invalidPieces);
      toast.warning('Algumas peças precisam ser revisadas');
      setActiveTab('register');
    } else {
      setActiveTab('pieces');
    }

    // Fechar diálogo após processamento
    setShowUpload(false);
    setImporting(false);
  };

  const handleResolveValidation = async (validation: ProjectPieceValidation, perfil: PerfilMaterial) => {
    const resp = await projetoPecaService.create({
      ...validation.peca,
      perfil_id: perfil.id,
      peso_por_metro: perfil.kg_por_metro,
      perfil_nao_encontrado: false
    });
    if (resp.success && resp.data) {
      setPieces(prev => [...prev, resp.data]);
      setValidations(prev => prev.filter(v => v !== validation));
      toast.success('Peça validada e cadastrada');
    } else {
      toast.error('Erro ao cadastrar peça');
    }
  };

  const handleDuplicateResolved = async (selected: ProjetoPeca[]) => {
    if (selected.length > 0) {
      const resp = await projetoPecaService.createBatch(selected);
      if (resp.success && resp.data) {
        toast.success(`${resp.data.length} peça(s) adicionadas`);
        await loadProjectData();
      } else {
        toast.error('Erro ao cadastrar peças');
      }
    }
    setDuplicateItems([]);
    setActiveTab('pieces');
  };

  const togglePieceSelection = (id: string) => {
    setSelectedPieces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleProfileSelection = (key: string, pieces: ProjetoPeca[]) => {
    const allSelected = pieces.every(p => selectedPieces.has(p.id));
    setSelectedPieces(prev => {
      const newSet = new Set(prev);
      pieces.forEach(p => {
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
      toast.success('Peças excluídas');
    } catch (err) {
      toast.error('Erro ao excluir peças');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const groupedPieces = pieces.reduce((acc, piece) => {
    const key = piece.perfil_id || 'sem_perfil';
    if (!acc[key]) {
      acc[key] = {
        perfil: piece.perfil,
        pieces: [],
        totalQuantity: 0,
        totalLength: 0,
        totalWeight: 0
      };
    }
    acc[key].pieces.push(piece);
    acc[key].totalQuantity += piece.quantidade;
    acc[key].totalLength += piece.comprimento_mm * piece.quantidade;
    acc[key].totalWeight +=
      (piece.peso_por_metro || 0) * piece.comprimento_mm * piece.quantidade / 1000;
    return acc;
  }, {} as Record<string, any>);

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
                  <CardTitle className="text-2xl font-bold tracking-tight">{project.nome}</CardTitle>
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
                    <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Cliente</p>
                    <p className="text-lg font-semibold text-gray-800">{project.clientes?.nome || 'Não definido'}</p>
                  </div>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                    <Building className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-emerald-600 uppercase tracking-wide">Obra</p>
                    <p className="text-lg font-semibold text-gray-800">{project.obras?.nome || 'Não definida'}</p>
                  </div>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors">
                    <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-600 uppercase tracking-wide">Criado em</p>
                    <p className="text-lg font-semibold text-gray-800">{format(new Date(project.created_at), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pieces' | 'optimizations' | 'register')} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg border-0">
            <TabsTrigger value="pieces" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300">
              <Package className="w-4 h-4" />
              Peças ({pieces.length})
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300">
              <Plus className="w-4 h-4" />
              Cadastrar Peça
            </TabsTrigger>
            <TabsTrigger value="optimizations" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300">
              <Calculator className="w-4 h-4" />
              Otimizações ({optimizations.length})
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
                {importing ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-600 font-medium">Extraindo peças do arquivo...</p>
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
                          onNavigateToProfileManagement={onNavigateToProfileManagement}
                        />
                      </div>
                    )}
                    <div className="flex justify-end pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowUpload(true)}
                        className="hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Anexar Arquivo
                      </Button>
                    </div>
                    <FileUploadDialog
                      open={showUpload}
                      onOpenChange={setShowUpload}
                      onProcessStart={handleImportStart}
                      onFileProcessed={handleFileProcessed}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pieces">
            <Card className="bg-white/95 backdrop-blur-lg shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    Peças por Perfil
                  </div>
                  <div className="flex gap-3">
                    {selectedPieces.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmDelete(true)}
                        className="hover:bg-red-600 transition-all duration-300"
                      >
                        Excluir Selecionadas ({selectedPieces.size})
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowOptimizationDialog(true)}
                      disabled={pieces.length === 0 || selectedPieces.size === 0}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Otimização
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieces.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">Nenhuma peça cadastrada neste projeto.</p>
                  </div>
                ) : (
                  <Accordion type="multiple" className="space-y-4">
                    {Object.entries(groupedPieces).map(([key, group]) => {
                      const allSelected = group.pieces.every((p: ProjetoPeca) => selectedPieces.has(p.id));
                      return (
                        <AccordionItem key={key} value={key} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                          <AccordionTrigger className="hover:no-underline px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 transition-all duration-300">
                            <div className="flex items-center gap-4 flex-1">
                              <Checkbox
                                checked={allSelected}
                                onCheckedChange={() => toggleProfileSelection(key, group.pieces)}
                                onClick={(e) => e.stopPropagation()}
                                className="scale-110"
                              />
                              <div className="flex-1">
                                <span className="font-semibold text-gray-800 text-lg">
                                  {group.perfil?.descricao_perfil || 'Perfil não definido'}
                                </span>
                              </div>
                              <div className="flex gap-3">
                                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 px-3 py-1">
                                  {group.totalQuantity} peças
                                </Badge>
                                <Badge variant="outline" className="border-purple-200 text-purple-700 px-3 py-1">
                                  {(group.totalLength / 1000).toFixed(2)}m
                                </Badge>
                                {group.totalWeight > 0 && (
                                  <Badge variant="outline" className="border-emerald-200 text-emerald-700 px-3 py-1">
                                    {group.totalWeight.toFixed(2)}kg
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 py-4 bg-white">
                            <div className="space-y-3">
                              {group.pieces.map((piece: ProjetoPeca) => {
                                const selected = selectedPieces.has(piece.id);
                                const peso = piece.peso_por_metro
                                  ? (piece.peso_por_metro * piece.comprimento_mm) / 1000
                                  : null;
                                return (
                                  <div key={piece.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-sm transition-all duration-300">
                                    <div className="flex items-start gap-4">
                                      <Checkbox
                                        checked={selected}
                                        onCheckedChange={() => togglePieceSelection(piece.id)}
                                        className="mt-1 scale-110"
                                      />
                                      <div className="space-y-2">
                                        
                                        {piece.perfil && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-600">Perfil:</span>
                                            <span className="text-sm text-gray-800 bg-blue-50 px-2 py-1 rounded">
                                              {piece.perfil.descricao_perfil}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold text-gray-600">Posição:</span>
                                          <span className="text-sm text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">
                                            {piece.posicao}
                                          </span>
                                        </div>
                                         {piece.tag && (
                                           <div className="flex items-center gap-2">
                                             <span className="text-sm font-semibold text-gray-600">TAG:</span>
                                             <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-medium">
                                               {piece.tag}
                                             </span>
                                           </div>
                                         )}
                                        <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-600">Comprimento:</span>
                                            <span className="text-sm text-gray-800 bg-emerald-50 px-2 py-1 rounded">
                                              {piece.comprimento_mm}mm × {piece.quantidade}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-600">Qtd:</span>
                                            <span className="text-sm text-gray-800 bg-blue-50 px-2 py-1 rounded">
                                              {piece.quantidade}
                                            </span>
                                          </div>
                                          {peso !== null && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-semibold text-gray-600">Peso:</span>
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
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Excluir
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
                {optimizations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <Calculator className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">Nenhuma otimização realizada para este projeto.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {optimizations.map((optimization) => {
                      const totalPieces = optimization.resultados?.bars?.reduce(
                        (sum: number, b: any) => sum + b.pieces.length,
                        0
                      ) || 0;
                      const cutPieces = optimization.resultados?.bars?.reduce(
                        (sum: number, b: any) =>
                          sum + b.pieces.filter((p: any) => p.cortada).length,
                        0
                      ) || 0;
                      const percent = totalPieces > 0 ? Math.round((cutPieces / totalPieces) * 100) : 0;

                      return (
                        <Card key={optimization.id} className="border border-gray-200 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-3">
                                <h4 className="text-lg font-semibold text-gray-800">{optimization.nome_lista}</h4>
                                <div className="flex gap-4">
                                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                    Barra: {optimization.tamanho_barra}mm
                                  </span>
                                  <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                                    {cutPieces}/{totalPieces} peças ({percent}%)
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(optimization.created_at), 'dd/MM/yyyy HH:mm')}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  setViewResults({
                                    res: optimization.resultados,
                                    bar: optimization.tamanho_barra,
                                    id: optimization.id
                                  })
                                }
                                className="hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300"
                              >
                                Visualizar Resultados
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <OptimizationCreateDialog
          open={showOptimizationDialog}
          onOpenChange={setShowOptimizationDialog}
          onCreate={(name, bar) =>
            onCreateOptimization(
              pieces.filter(p => selectedPieces.has(p.id)),
              name,
              bar
            ).then(() => {
              setShowOptimizationDialog(false);
              setActiveTab('optimizations');
              void loadProjectData();
            })
          }
          selectedPieces={pieces.filter(p => selectedPieces.has(p.id))}
          onNavigateToProfileManagement={onNavigateToProfileManagement}
        />
        <OptimizationResultsDialog
          open={!!viewResults}
          onOpenChange={() => setViewResults(null)}
          results={viewResults?.res || null}
          barLength={viewResults?.bar || 0}
          project={null}
          optimizationId={viewResults?.id || null}
        />
        <DeleteConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          onConfirm={handleDeleteSelected}
          title="Excluir Peças"
          description={`Tem certeza que deseja excluir ${selectedPieces.size} peça(s)? Esta ação não pode ser desfeita.`}
          loading={deleting}
        />
      </div>
    </div>
  );
};
