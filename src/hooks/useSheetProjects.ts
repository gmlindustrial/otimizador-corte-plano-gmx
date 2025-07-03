
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SheetProject, SheetCutPiece } from '@/types/sheet';

export interface SheetProjectData {
  project: SheetProject;
  pieces: SheetCutPiece[];
}

export const useSheetProjects = () => {
  const [savedProjects, setSavedProjects] = useState<SheetProjectData[]>([]);
  const [loading, setLoading] = useState(false);

  const saveProject = async (projectData: SheetProjectData) => {
    try {
      const { project, pieces } = projectData;

      const insertData = {
        nome: project.name,
        numero_projeto: project.projectNumber,
        turno: project.turno,
        lista: project.lista,
        revisao: project.revisao,
        validacao_qa: project.validacaoQA,
        qr_code: project.qrCode || generateQRCode(project.id, project.lista),
        dados_projeto: {
          type: 'sheet',
          client: project.client,
          obra: project.obra,
          sheetWidth: project.sheetWidth,
          sheetHeight: project.sheetHeight,
          thickness: project.thickness,
          kerf: project.kerf,
          process: project.process,
          material: project.material,
          operador: project.operador,
          aprovadorQA: project.aprovadorQA,
          pieces,
          originalProjectId: project.id
        }
      };

      const { data, error } = await supabase
        .from('projetos')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Projeto de chapas salvo com sucesso');
      await loadProjects();
      return data;
    } catch (error) {
      console.error('Erro ao salvar projeto de chapas:', error);
      toast.error('Erro ao salvar projeto de chapas');
      throw error;
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('dados_projeto->type', 'sheet')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedProjects = data
        .map(convertFromDatabase)
        .filter(project => project !== null) as SheetProjectData[];

      setSavedProjects(convertedProjects);
    } catch (error) {
      console.error('Erro ao carregar projetos de chapas:', error);
      toast.error('Erro ao carregar projetos de chapas');
    } finally {
      setLoading(false);
    }
  };

  const convertFromDatabase = (dbProject: any): SheetProjectData | null => {
    try {
      const dadosProjeto = dbProject.dados_projeto;
      
      if (!dadosProjeto || dadosProjeto.type !== 'sheet') {
        return null;
      }

      const project: SheetProject = {
        id: dadosProjeto.originalProjectId || dbProject.id,
        name: dbProject.nome,
        projectNumber: dbProject.numero_projeto,
        client: dadosProjeto.client || '',
        obra: dadosProjeto.obra || '',
        lista: dbProject.lista,
        revisao: dbProject.revisao,
        sheetWidth: dadosProjeto.sheetWidth || 2550,
        sheetHeight: dadosProjeto.sheetHeight || 6000,
        thickness: dadosProjeto.thickness || 6,
        kerf: dadosProjeto.kerf || 2,
        process: dadosProjeto.process || 'plasma',
        material: dadosProjeto.material || 'A36',
        operador: dadosProjeto.operador || '',
        turno: dbProject.turno,
        aprovadorQA: dadosProjeto.aprovadorQA || '',
        validacaoQA: dbProject.validacao_qa,
        date: dbProject.created_at,
        qrCode: dbProject.qr_code || ''
      };

      return {
        project,
        pieces: dadosProjeto.pieces || []
      };
    } catch (error) {
      console.error('Erro ao converter projeto de chapas:', error);
      return null;
    }
  };

  const generateQRCode = (projectId: string, lista: string) => {
    const qrData = `${window.location.origin}/lista/${projectId}/${lista}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
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
