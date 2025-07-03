
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { Projeto } from '../interfaces';
import type { ServiceResponse, ListResponse } from '../base/types';
import type { Project, CutPiece } from '@/pages/Index';

export interface LinearProjectData {
  project: Project;
  pieces: CutPiece[];
  barLength: number;
}

export class LinearProjectService extends BaseService<Projeto> {
  constructor() {
    super('projetos');
  }

  async saveLinearProject(projectData: LinearProjectData): Promise<ServiceResponse<Projeto>> {
    try {
      const { project, pieces, barLength } = projectData;

      // Prepare project data for database
      const insertData = {
        nome: project.name,
        numero_projeto: project.projectNumber,
        cliente_id: null, // Will be linked later when client management is implemented
        turno: project.turno,
        lista: project.lista,
        revisao: project.revisao,
        validacao_qa: project.validacaoQA,
        enviar_sobras_estoque: project.enviarSobrasEstoque,
        qr_code: project.qrCode,
        dados_projeto: {
          type: 'linear',
          client: project.client,
          obra: project.obra,
          tipoMaterial: project.tipoMaterial,
          operador: project.operador,
          aprovadorQA: project.aprovadorQA,
          pieces: pieces,
          barLength,
          originalProjectId: project.id
        }
      };

      const { data: result, error } = await supabase
        .from('projetos')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      console.log('Projeto linear salvo no Supabase:', result);

      return {
        data: result as Projeto,
        error: null,
        success: true
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao salvar projeto linear');
    }
  }

  async loadLinearProjects(): Promise<ListResponse<Projeto>> {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .not('dados_projeto', 'is', null)
        .eq('dados_projeto->type', 'linear')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      console.error('Erro ao carregar projetos lineares:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Erro ao carregar projetos lineares',
        success: false,
        total: 0
      };
    }
  }

  convertFromDatabase(dbProject: Projeto): LinearProjectData | null {
    try {
      const dadosProjeto = dbProject.dados_projeto as any;
      
      if (!dadosProjeto || dadosProjeto.type !== 'linear') {
        return null;
      }

      const project: Project = {
        id: dadosProjeto.originalProjectId || dbProject.id,
        name: dbProject.nome,
        projectNumber: dbProject.numero_projeto,
        client: dadosProjeto.client || '',
        obra: dadosProjeto.obra || '',
        lista: dbProject.lista,
        revisao: dbProject.revisao,
        tipoMaterial: dadosProjeto.tipoMaterial || '',
        operador: dadosProjeto.operador || '',
        turno: dbProject.turno,
        aprovadorQA: dadosProjeto.aprovadorQA || '',
        validacaoQA: dbProject.validacao_qa,
        enviarSobrasEstoque: dbProject.enviar_sobras_estoque,
        qrCode: dbProject.qr_code || '',
        date: dbProject.created_at
      };

      return {
        project,
        pieces: dadosProjeto.pieces || [],
        barLength: dadosProjeto.barLength || 6000
      };
    } catch (error) {
      console.error('Erro ao converter projeto do banco:', error);
      return null;
    }
  }
}

export const linearProjectService = new LinearProjectService();
