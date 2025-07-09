
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import { isUUID } from '@/lib/utils';
import type { Projeto } from '../interfaces';
import type { ServiceResponse, ListResponse } from '../base/types';
import type { Project, CutPiece } from '@/pages/Index';

export interface ProjectData {
  project: Project;
  pieces: CutPiece[];
  barLength: number;
}

export class ProjectService extends BaseService<Projeto> {
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

  async saveProject(projectData: ProjectData): Promise<ServiceResponse<Projeto>> {
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

  async loadProjects(): Promise<ListResponse<Projeto>> {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select(`
          *,
          clientes:cliente_id(nome),
          obras:obra_id(nome),
          materiais:material_id(tipo),
          operadores:operador_id(nome),
          inspetores_qa:inspetor_id(nome)
        `)
        .not('dados_projeto', 'is', null)
        .eq('dados_projeto->>type', 'linear')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projects = data || [];

      return {
        data: projects,
        error: null,
        success: true,
        total: projects.length
      };
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar projetos';
      
      return {
        data: [],
        error: errorMessage,
        success: false,
        total: 0
      };
    }
  }

  async deleteProject(projectId: string): Promise<ServiceResponse<void>> {
    try {
      // Delete related pieces first to mimic cascade behavior
      const { error: piecesError } = await supabase
        .from('projeto_pecas')
        .delete()
        .eq('projeto_id', projectId);

      if (piecesError) throw piecesError;

      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      console.log('Projeto excluído:', projectId);

      return {
        data: null,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir projeto';
      console.error('Erro ao excluir projeto:', error);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async updateProject(
    projectId: string,
    updates: Partial<Projeto>
  ): Promise<ServiceResponse<Projeto>> {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as Projeto, error: null, success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao atualizar projeto';
      console.error('Erro ao atualizar projeto:', error);
      return { data: null, error: errorMessage, success: false };
    }
  }

  convertFromDatabase(dbProject: Projeto): ProjectData | null {
    try {
      const dadosProjeto = dbProject.dados_projeto as any;
      
      if (!dadosProjeto || dadosProjeto.type !== 'linear') {
        return null;
      }

      // Use foreign key relationships if available, fallback to JSON data
      const clientName = (dbProject as any).clientes?.nome || dadosProjeto.client || '';
      const obraName = (dbProject as any).obras?.nome || dadosProjeto.obra || '';
      const materialType = (dbProject as any).materiais?.tipo || dadosProjeto.tipoMaterial || '';
      const operadorName = (dbProject as any).operadores?.nome || dadosProjeto.operador || '';
      const inspetorName = (dbProject as any).inspetores_qa?.nome || dadosProjeto.aprovadorQA || '';

      const project: Project = {
        id: dadosProjeto.originalProjectId || dbProject.id,
        name: dbProject.nome,
        projectNumber: dbProject.numero_projeto,
        client: clientName,
        obra: obraName,
        lista: dbProject.lista,
        revisao: dbProject.revisao,
        tipoMaterial: materialType,
        operador: operadorName,
        turno: dbProject.turno,
        aprovadorQA: inspetorName,
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

export const projectService = new ProjectService();
