
import { supabase } from '@/integrations/supabase/client';
import type { Project, OptimizationResult, CutPiece } from '@/pages/Index';

export class ProjectService {
  static async saveOrGetProject(
    project: Project,
    pieces: CutPiece[],
    results: OptimizationResult,
    barLength: number
  ): Promise<string | null> {
    try {
      // Verificar se projeto já existe
      const { data: existingProject, error: projectError } = await supabase
        .from('projetos')
        .select('id')
        .eq('numero_projeto', project.projectNumber)
        .maybeSingle();

      if (!projectError && existingProject) {
        return existingProject.id;
      }

      // Preparar dados do projeto com conversão explícita para JSON
      const projectData = {
        barLength,
        pieces: pieces as any,
        results: results as any
      };

      // Salvar novo projeto
      const { data: newProject, error: createError } = await supabase
        .from('projetos')
        .insert({
          nome: project.name,
          numero_projeto: project.projectNumber,
          cliente_id: await this.getClienteIdByName(project.client),
          obra_id: await this.getObraIdByName(project.obra),
          material_id: await this.getMaterialIdByType(project.tipoMaterial),
          operador_id: await this.getOperadorIdByName(project.operador),
          inspetor_id: await this.getInspetorIdByName(project.aprovadorQA),
          lista: project.lista,
          revisao: project.revisao,
          turno: project.turno,
          validacao_qa: project.validacaoQA,
          enviar_sobras_estoque: project.enviarSobrasEstoque,
          qr_code: project.qrCode,
          dados_projeto: projectData as any
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Erro ao salvar projeto:', createError);
        return null;
      }

      return newProject.id;
    } catch (error) {
      console.error('Erro ao verificar/salvar projeto:', error);
      return null;
    }
  }

  private static async getClienteIdByName(clienteName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id')
        .eq('nome', clienteName)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
  }

  private static async getObraIdByName(obraName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('id')
        .eq('nome', obraName)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar obra:', error);
      return null;
    }
  }

  static async getMaterialIdByType(materialType: string): Promise<string | null> {
    try {
      console.log('Buscando material por tipo:', materialType);
      
      // Se materialType já é um UUID, retorná-lo
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(materialType);
      if (isUUID) {
        return materialType;
      }

      const { data, error } = await supabase
        .from('materiais')
        .select('id')
        .eq('tipo', materialType)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar material:', error);
        return null;
      }

      console.log('Material encontrado:', data);
      return data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar material:', error);
      return null;
    }
  }

  private static async getOperadorIdByName(operadorName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('id')
        .eq('nome', operadorName)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar operador:', error);
      return null;
    }
  }

  private static async getInspetorIdByName(inspetorName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('inspetores_qa')
        .select('id')
        .eq('nome', inspetorName)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar inspetor:', error);
      return null;
    }
  }
}
