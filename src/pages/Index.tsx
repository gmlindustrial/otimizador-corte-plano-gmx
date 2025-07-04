import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast"
import { MainLayout } from '@/layouts/MainLayout';
import { MaterialInput } from '@/components/MaterialInput';
import { ResultDisplay } from '@/components/ResultDisplay';
import { ProjectForm } from '@/components/ProjectForm';
import { CadastroManagerIntegrated } from '@/components/CadastroManagerIntegrated';
import { linearOptimizationService } from '@/services/LinearOptimizationService';
import { LinearProjectService, LinearProjectData } from '@/services/entities/LinearProjectService';
import { useSettings } from '@/hooks/useSettings';
import { useProject } from '@/hooks/useProject';
import type { CutPiece } from '@/types/cutPiece';

interface Project {
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
  qrCode?: string;
  date?: string;
}

const Index = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [pieces, setPieces] = useState<CutPiece[]>([]);
  const [results, setResults] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showCadastroManager, setShowCadastroManager] = useState(false);
  const { settings } = useSettings();
  const { project, setProject } = useProject();

  const linearProjectService = new LinearProjectService();

  const handleOptimize = useCallback(async () => {
    if (pieces.length === 0) {
      toast({
        title: "Nenhuma peça cadastrada",
        description: "Adicione peças para otimizar o corte.",
      });
      return;
    }

    setIsOptimizing(true);
    setResults(null);

    try {
      const optimizationResult = await linearOptimizationService.optimize(pieces, settings.barLength);
      setResults(optimizationResult);

      toast({
        title: "Otimização Concluída!",
        description: `Utilização: ${optimizationResult.waste.toFixed(2)}% de perda.`,
      });
    } catch (error: any) {
      console.error("Erro durante a otimização:", error);
      toast({
        variant: "destructive",
        title: "Erro na Otimização",
        description: error.message || "Ocorreu um erro ao otimizar o corte.",
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [pieces, settings, toast]);

  const handleSaveProject = async () => {
    if (!project.name || !project.projectNumber) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Nome e número do projeto são obrigatórios.",
      });
      return;
    }

    if (pieces.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Adicione peças para salvar o projeto.",
      });
      return;
    }

    try {
      setIsOptimizing(true);

      const projectData: LinearProjectData = {
        project: project,
        pieces: pieces,
        barLength: settings.barLength
      };

      const response = await linearProjectService.saveLinearProject(projectData);

      if (response.success) {
        toast({
          title: "Projeto Salvo!",
          description: "O projeto foi salvo com sucesso.",
        });
        router.push('/linear/projects');
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao salvar",
          description: response.error || "Ocorreu um erro ao salvar o projeto.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao salvar o projeto:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar o projeto.",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleUpdateData = () => {
    console.log('Dados atualizados!');
  };

  if (showCadastroManager) {
    return (
      <MainLayout>
        <CadastroManagerIntegrated onUpdateData={handleUpdateData} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2">
          <MaterialInput
            pieces={pieces}
            setPieces={setPieces}
            onOptimize={handleOptimize}
            disabled={isOptimizing}
          />
        </div>

        <div className="col-span-1">
          <ProjectForm
            project={project}
            setProject={setProject}
            onSave={handleSaveProject}
            disabled={isOptimizing}
            onManageData={() => setShowCadastroManager(true)}
          />
        </div>
      </div>

      {results && (
        <div className="mt-12">
          <ResultDisplay results={results} />
        </div>
      )}
    </MainLayout>
  );
};

export default Index;
