import { useState, useEffect } from 'react';
import { projectHistoryService, type ProjectHistoryEntry, type ProjectHistoryFilters } from '@/services/entities/ProjectHistoryService';
import { toast } from 'sonner';

export const useProjectHistory = (projectId: string) => {
  const [history, setHistory] = useState<ProjectHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ProjectHistoryFilters>({});

  const loadHistory = async (newFilters?: ProjectHistoryFilters) => {
    try {
      setLoading(true);
      const currentFilters = newFilters || filters;
      const response = await projectHistoryService.getProjectHistory(projectId, currentFilters);
      
      if (response.success && response.data) {
        setHistory(response.data);
      } else {
        console.error('Erro ao carregar histórico:', response.error);
        toast.error('Erro ao carregar histórico do projeto');
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico do projeto');
    } finally {
      setLoading(false);
    }
  };

  const exportHistory = async () => {
    try {
      const response = await projectHistoryService.exportProjectHistory(projectId);
      
      if (response.success && response.data) {
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `historico_projeto_${projectId}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Histórico exportado com sucesso');
      } else {
        toast.error('Erro ao exportar histórico');
      }
    } catch (error) {
      console.error('Erro ao exportar histórico:', error);
      toast.error('Erro ao exportar histórico');
    }
  };

  const updateFilters = (newFilters: ProjectHistoryFilters) => {
    setFilters(newFilters);
    loadHistory(newFilters);
  };

  useEffect(() => {
    if (projectId) {
      loadHistory();
    }
  }, [projectId]);

  return {
    history,
    loading,
    filters,
    loadHistory,
    exportHistory,
    updateFilters
  };
};