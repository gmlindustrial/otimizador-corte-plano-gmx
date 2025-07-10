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
  onCreateOptimization: (pieces: ProjetoPeca[]) => void;
}

export const ProjectDetailsView = ({ 
  project, 
  onBack, 
  onEdit, 
  onDelete,
  onCreateOptimization 
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

      // TODO: Carregar otimizações quando service estiver pronto
      setOptimizations([]);
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
      pieces.some((p) => p.tag_peca === vp.tag_peca)
    ).map((vp) => ({ existing: pieces.find(p => p.tag_peca === vp.tag_peca)!, imported: vp }));

    const uniqueValid = validPieces.filter(
      (vp) => !pieces.some((p) => p.tag_peca === vp.tag_peca)
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
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white hover:text-green-600"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
              <div>
                <CardTitle className="text-xl mb-1">{project.nome}</CardTitle>
                <p className="text-sm opacity-90">
                  {project.numero_projeto} | {project.clientes?.nome} - {project.obras?.nome}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={onEdit}
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white hover:text-green-600"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button
                onClick={onDelete}
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white hover:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Project Info */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Informações do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium">{project.clientes?.nome || 'Não definido'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Obra</p>
                <p className="font-medium">{project.obras?.nome || 'Não definida'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Data de Criação</p>
                <p className="font-medium">{format(new Date(project.created_at), 'dd/MM/yyyy HH:mm')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pieces" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Peças ({pieces.length})
          </TabsTrigger>
          <TabsTrigger value="register" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Cadastrar Peça
          </TabsTrigger>
          <TabsTrigger value="optimizations" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Otimizações ({optimizations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle>Cadastrar Nova Peça</CardTitle>
            </CardHeader>
            <CardContent>
              {importing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Extraindo peças do arquivo...
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
                    <div className="mt-4">
                      <ProjectValidationAlert validations={validations} onResolve={handleResolveValidation} />
                    </div>
                  )}
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={() => setShowUpload(true)}>
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
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Peças por Perfil</span>
                <div className="flex gap-2">
                  {selectedPieces.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Excluir Selecionadas
                    </Button>
                  )}
                  <Button
                    onClick={() => onCreateOptimization(pieces.filter(p => selectedPieces.has(p.id)))}
                    disabled={pieces.length === 0}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Nova Otimização
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieces.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma peça cadastrada neste projeto.</div>
              ) : (
                <Accordion type="multiple" className="space-y-4" defaultValue={Object.keys(groupedPieces)}>
                  {Object.entries(groupedPieces).map(([key, group]) => {
                    const allSelected = group.pieces.every((p: ProjetoPeca) => selectedPieces.has(p.id));
                    return (
                      <AccordionItem key={key} value={key} className="border rounded-lg">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={() => toggleProfileSelection(key, group.pieces)}
                              className="mr-2"
                            />
                            <span className="font-medium">
                              {group.perfil?.descricao_perfil || 'Perfil não definido'}
                            </span>
                            <div className="flex gap-2 ml-auto">
                              <Badge variant="secondary">{group.totalQuantity} peças</Badge>
                              <Badge variant="outline">{(group.totalLength / 1000).toFixed(2)}m</Badge>
                              {group.totalWeight > 0 && (
                                <Badge variant="outline">{group.totalWeight.toFixed(2)}kg</Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 py-2">
                            {group.pieces.map((piece: ProjetoPeca) => {
                              const selected = selectedPieces.has(piece.id);
                              const peso = piece.peso_por_metro
                                ? (piece.peso_por_metro * piece.comprimento_mm) / 1000
                                : null;
                              return (
                                <div key={piece.id} className="flex items-center justify-between border rounded-md p-2 bg-gray-50">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={selected}
                                      onCheckedChange={() => togglePieceSelection(piece.id)}
                                    />
                                    <div>
                                      <div className="font-medium text-sm">{piece.tag_peca}</div>
                                      {piece.conjunto && (
                                        <div className="text-xs text-blue-600">{piece.conjunto}</div>
                                      )}
                                      <div className="text-xs text-gray-600">
                                        {piece.comprimento_mm}mm × {piece.quantidade}
                                        {peso !== null && ` - ${peso.toFixed(2)}kg`}
                                      </div>
                                      {piece.perfil && (
                                        <div className="text-xs text-gray-500">
                                          {piece.perfil.descricao_perfil}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedPieces(new Set([piece.id]));
                                      setConfirmDelete(true);
                                    }}
                                    className="text-red-600 hover:bg-red-50"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimizations">
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle>Histórico de Otimizações</CardTitle>
            </CardHeader>
            <CardContent>
              {optimizations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma otimização realizada para este projeto.
                </div>
              ) : (
                <div className="space-y-3">
                  {optimizations.map((optimization) => (
                    <Card key={optimization.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{optimization.nome_lista}</h4>
                            <p className="text-sm text-gray-600">
                              Barra: {optimization.tamanho_barra}mm
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(optimization.created_at), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Visualizar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <DeleteConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={handleDeleteSelected}
        title="Excluir Peças"
        description={`Tem certeza que deseja excluir ${selectedPieces.size} peça(s)? Esta ação não pode ser desfeita.`}
        loading={deleting}
      />
    </div>
  );
};
