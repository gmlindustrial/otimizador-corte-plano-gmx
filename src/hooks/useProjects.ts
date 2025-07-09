
import { useState, useEffect } from 'react';
import { projectService, type ProjectData } from '@/services/entities/ProjectService';
import { toast } from 'sonner';

export const useProjects = () => {
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.loadProjects();
      
      if (response.success && response.data) {
        const convertedProjects = response.data
          .map(dbProject => {
            const converted = projectService.convertFromDatabase(dbProject);
            if (converted) {
              // Adicionar o ID do banco de dados
              return { ...converted, dbId: dbProject.id };
            }
            return null;
          })
          .filter(project => project !== null) as (ProjectData & { dbId: string })[];
        
        setSavedProjects(convertedProjects);
        console.log('Projetos carregados:', convertedProjects);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      toast.error('Erro ao carregar projetos salvos');
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async (projectData: ProjectData) => {
    try {
      const response = await projectService.saveProject(projectData);
      
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
