
import { useState, useEffect } from 'react';
import { linearProjectService, type LinearProjectData } from '@/services/entities/LinearProjectService';
import { toast } from 'sonner';

export const useLinearProjects = () => {
  const [savedProjects, setSavedProjects] = useState<LinearProjectData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await linearProjectService.loadLinearProjects();
      
      if (response.success && response.data) {
        const convertedProjects = response.data
          .map(dbProject => {
            const converted = linearProjectService.convertFromDatabase(dbProject);
            if (converted) {
              // Adicionar o ID do banco de dados
              return { ...converted, dbId: dbProject.id };
            }
            return null;
          })
          .filter(project => project !== null) as (LinearProjectData & { dbId: string })[];
        
        setSavedProjects(convertedProjects);
        console.log('Projetos lineares carregados:', convertedProjects);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      toast.error('Erro ao carregar projetos salvos');
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async (projectData: LinearProjectData) => {
    try {
      const response = await linearProjectService.saveLinearProject(projectData);
      
      if (response.success) {
        toast.success('Projeto salvo com sucesso');
        await loadProjects(); // Recarregar lista
        return response.data;
      } else {
        throw new Error(response.error || 'Erro ao salvar projeto');
      }
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      toast.error('Erro ao salvar projeto');
      throw error;
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return {
    savedProjects,
    loading,
    saveProject,
    loadProjects
  };
};
