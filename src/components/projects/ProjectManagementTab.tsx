import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderPlus, Upload, Calculator, AlertTriangle } from 'lucide-react';
import { Project } from '@/pages/Index';
import { ProjectCreationWizard } from './ProjectCreationWizard';
import { PieceRegistrationForm } from './PieceRegistrationForm';
import { FileUploadDialog } from './FileUploadDialog';
import { ProfileGroupingView } from './ProfileGroupingView';
import { ProjectValidationAlert } from './ProjectValidationAlert';
import { ProjectsList } from './ProjectsList';
import { projetoPecaService } from '@/services/entities/ProjetoPecaService';
import type { ProjetoPeca, ProjectPieceValidation } from '@/types/project';

interface ProjectManagementTabProps {
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
  onLoadLinearProject?: (projectData: any) => void;
  onLoadSheetProject?: (projectData: any) => void;
}

export const ProjectManagementTab = ({
  selectedProject,
  onProjectSelect,
  onLoadLinearProject,
  onLoadSheetProject
}: ProjectManagementTabProps) => {
  const [activeStep, setActiveStep] = useState<'create' | 'pieces' | 'optimize'>('create');
  const [pieces, setPieces] = useState<ProjetoPeca[]>([]);
  const [invalidPieces, setInvalidPieces] = useState<ProjectPieceValidation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      loadProjectPieces();
      setActiveStep('pieces');
    }
  }, [selectedProject]);

  const loadProjectPieces = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      const response = await projetoPecaService.getByProjectId(selectedProject.id);
      if (response.success && response.data) {
        const validPieces = response.data.filter((p: ProjetoPeca) => !p.perfil_nao_encontrado);
        const invalidPiecesData = response.data.filter((p: ProjetoPeca) => p.perfil_nao_encontrado);
        
        setPieces(validPieces);
        setInvalidPieces(invalidPiecesData.map(p => ({
          peca: p,
          isValid: false,
          suggestions: []
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar peças do projeto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (project: Project) => {
    onProjectSelect(project);
    setActiveStep('pieces');
    setCreating(false);
  };

  const handlePieceAdded = (newPiece: ProjetoPeca) => {
    setPieces(prev => [...prev, newPiece]);
  };

  const handleFileProcessed = async (processedPieces: any[]) => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const { validPieces, invalidPieces: newInvalidPieces } = await projetoPecaService.validateAndProcessPieces(
        processedPieces,
        selectedProject.id
      );

      // Salvar peças válidas
      if (validPieces.length > 0) {
        const response = await projetoPecaService.createBatch(validPieces);
        if (response.success && response.data) {
          setPieces(prev => [...prev, ...response.data]);
        }
      }

      // Mostrar peças inválidas para resolução
      if (newInvalidPieces.length > 0) {
        setInvalidPieces(prev => [...prev, ...newInvalidPieces]);
      }

      setShowFileUpload(false);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidPieceResolved = (validation: ProjectPieceValidation, selectedPerfil: any) => {
    // Remover da lista de peças inválidas
    setInvalidPieces(prev => prev.filter(v => v.peca.tag_peca !== validation.peca.tag_peca));
    
    // Adicionar à lista de peças válidas (seria necessário salvar no banco também)
    const updatedPiece: ProjetoPeca = {
      ...validation.peca,
      perfil_id: selectedPerfil.id,
      peso_por_metro: selectedPerfil.kg_por_metro,
      perfil_nao_encontrado: false,
      perfil: selectedPerfil
    };
    
    setPieces(prev => [...prev, updatedPiece]);
  };

  if (!selectedProject) {
    if (creating) {
      return (
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5" />
                Novo Projeto
              </span>
              <Button variant="outline" size="sm" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ProjectCreationWizard onProjectCreated={handleProjectCreated} />
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setCreating(true)} className="bg-blue-600 text-white hover:bg-blue-700">
            <FolderPlus className="w-4 h-4 mr-2" /> Novo Projeto
          </Button>
        </div>
        <ProjectsList
          onLoadLinearProject={onLoadLinearProject || (() => {})}
          onLoadSheetProject={onLoadSheetProject || (() => {})}
          onSelectProject={(item) => onProjectSelect(item.project)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{selectedProject.name}</h3>
              <p className="text-sm opacity-90">
                {selectedProject.projectNumber} | {selectedProject.client} - {selectedProject.obra}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCreating(false);
                onProjectSelect(null);
              }}
              className="text-white border-white hover:bg-white hover:text-green-600"
            >
              Novo Projeto
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Validation Alerts */}
      {invalidPieces.length > 0 && (
        <ProjectValidationAlert
          validations={invalidPieces}
          onResolve={handleInvalidPieceResolved}
        />
      )}

      {/* Main Content */}
      <Tabs value={activeStep} onValueChange={(value) => setActiveStep(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pieces" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Cadastrar Peças
          </TabsTrigger>
          <TabsTrigger value="optimize" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Otimizar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pieces" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manual Entry */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle>Cadastro Manual</CardTitle>
              </CardHeader>
              <CardContent>
                <PieceRegistrationForm
                  projectId={selectedProject.id}
                  onPieceAdded={handlePieceAdded}
                />
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle>Upload de Arquivo</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowFileUpload(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Arquivo AutoCAD
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Pieces List */}
          {pieces.length > 0 && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle>Peças Cadastradas ({pieces.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pieces.map((piece) => (
                    <div key={piece.id} className="p-4 border rounded-lg bg-gray-50">
                      <div className="font-medium">{piece.tag_peca}</div>
                      <div className="text-sm text-gray-600">
                        {piece.perfil?.descricao_perfil || piece.descricao_perfil_raw}
                      </div>
                      <div className="text-sm text-gray-600">
                        {piece.comprimento_mm}mm x {piece.quantidade}
                      </div>
                      {piece.conjunto && (
                        <div className="text-xs text-blue-600">{piece.conjunto}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimize">
          <ProfileGroupingView
            projectId={selectedProject.id}
            pieces={pieces}
          />
        </TabsContent>
      </Tabs>

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={showFileUpload}
        onOpenChange={setShowFileUpload}
        onFileProcessed={handleFileProcessed}
      />
    </div>
  );
};