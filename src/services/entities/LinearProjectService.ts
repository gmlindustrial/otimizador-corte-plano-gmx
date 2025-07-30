
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import { isUUID } from '@/lib/utils';
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

  // Helper methods to find entity IDs by name with proper typing
  private async findClienteIdByName(name: string): Promise<string | null> {
    if (!name) return null;
    if (isUUID(name)) return name;
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id')
        .ilike('nome', name.trim())
        .maybeSingle();

      if (error || !data) return null;
      return data.id as string;
    } catch (error) {
      console.error(`Erro ao buscar ID de cliente:`, error);
      return null;
    }
  }

  private async findObraIdByName(name: string): Promise<string | null> {
    if (!name) return null;
    if (isUUID(name)) return name;
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('id')
        .ilike('nome', name.trim())
        .maybeSingle();

      if (error || !data) return null;
      return data.id as string;
    } catch (error) {
      console.error(`Erro ao buscar ID de obra:`, error);
      return null;
    }
  }

  private async findMaterialIdByType(type: string): Promise<string | null> {
    if (!type) return null;
    if (isUUID(type)) return type;
    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('id')
        .ilike('tipo', type.trim())
        .maybeSingle();

      if (error || !data) return null;
      return data.id as string;
    } catch (error) {
      console.error(`Erro ao buscar ID de material:`, error);
      return null;
    }
  }

  private async findOperadorIdByName(name: string): Promise<string | null> {
    if (!name) return null;
    if (isUUID(name)) return name;
    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('id')
        .ilike('nome', name.trim())
        .maybeSingle();

      if (error || !data) return null;
      return data.id as string;
    } catch (error) {
      console.error(`Erro ao buscar ID de operador:`, error);
      return null;
    }
  }

  private async findInspetorIdByName(name: string): Promise<string | null> {
    if (!name) return null;
    if (isUUID(name)) return name;
    try {
      const { data, error } = await supabase
        .from('inspetores_qa')
        .select('id')
        .ilike('nome', name.trim())
        .maybeSingle();

      if (error || !data) return null;
      return data.id as string;
    } catch (error) {
      console.error(`Erro ao buscar ID de inspetor:`, error);
      return null;
    }
  }

  async saveLinearProject(projectData: LinearProjectData): Promise<ServiceResponse<Projeto>> {
    try {
      const { project, pieces, barLength } = projectData;

      // Buscar IDs das entidades pelos nomes
      const clienteId = await this.findClienteIdByName(project.client);
      const obraId = await this.findObraIdByName(project.obra);
      const materialId = await this.findMaterialIdByType(project.tipoMaterial);
      const operadorId = await this.findOperadorIdByName(project.operador);
      const inspetorId = await this.findInspetorIdByName(project.aprovadorQA);

      // Prepare project data for database - cast to Json compatible format
      const projectDataForDb = {
        type: 'linear',
        client: project.client,
        obra: project.obra,
        tipoMaterial: project.tipoMaterial,
        operador: project.operador,
        aprovadorQA: project.aprovadorQA,
        pieces: pieces,
        barLength,
        originalProjectId: project.id
      };

      const insertData = {
        nome: project.name,
        numero_projeto: project.projectNumber,
        cliente_id: clienteId,
        obra_id: obraId,
        material_id: materialId,
        operador_id: operadorId,
        inspetor_id: inspetorId,
        turno: project.turno,
        lista: project.lista,
        revisao: project.revisao,
        validacao_qa: project.validacaoQA,
        enviar_sobras_estoque: project.enviarSobrasEstoque,
        qr_code: project.qrCode,
        dados_projeto: projectDataForDb as any
      };

      const { data: result, error } = await supabase
        .from('projetos')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      console.log('Projeto linear salvo no Supabase com IDs mapeados:', result);

      return {
        data: result as Projeto,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar projeto linear';
      console.error('Erro ao salvar projeto linear:', error);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async loadLinearProjects(): Promise<ListResponse<Projeto>> {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .not('dados_projeto', 'is', null)
        .eq('dados_projeto->>type', 'linear')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projects = data || [];

      return {
        data: projects as any, // Temporary fix for type mismatch
        error: null,
        success: true,
        total: projects.length
      };
    } catch (error) {
      console.error('Erro ao carregar projetos lineares:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar projetos lineares';
      
      return {
        data: [],
        error: errorMessage,
        success: false,
        total: 0
      };
    }
  }

  async deleteLinearProject(projectId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      console.log('Projeto linear excluído:', projectId);

      return {
        data: null,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir projeto linear';
      console.error('Erro ao excluir projeto linear:', error);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  convertFromDatabase(dbProject: any): LinearProjectData | null {
    try {
      if (!dbProject || !dbProject.dados_projeto) {
        return null;
      }

      const dadosProjeto = dbProject.dados_projeto;
      
      if (dadosProjeto.type !== 'linear') {
        return null;
      }

      const project = {
        id: dadosProjeto.originalProjectId || dbProject.id,
        name: dbProject.nome,
        projectNumber: dbProject.numero_projeto,
        client: dadosProjeto.client || '',
        obra: dadosProjeto.obra || '',
        tipoMaterial: dadosProjeto.tipoMaterial || '',
        operador: dadosProjeto.operador || '',
        aprovadorQA: dadosProjeto.aprovadorQA || '',
        turno: dbProject.turno || '',
        lista: dbProject.lista || '',
        revisao: dbProject.revisao || '',
        validacaoQA: dbProject.validacao_qa || false,
        enviarSobrasEstoque: dbProject.enviar_sobras_estoque || false,
        qrCode: dbProject.qr_code || '',
        date: new Date().toISOString()
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
