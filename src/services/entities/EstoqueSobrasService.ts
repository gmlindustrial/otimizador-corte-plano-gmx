
import { BaseService } from '../base/BaseService';
import type { EstoqueSobra } from '../interfaces';

export class EstoqueSobrasService extends BaseService<EstoqueSobra> {
  constructor() {
    super('estoque_sobras');
  }

  async getByMaterial(materialId: string) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar sobras por material');
    }
  }

  async getDisponiveis(materialId?: string) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('disponivel', true);

      if (materialId) {
        query = query.eq('material_id', materialId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar sobras disponíveis');
    }
  }

  async marcarComoUsada(id: string) {
    return this.update({
      id,
      data: { disponivel: false }
    });
  }

  private get supabase() {
    return require('@/integrations/supabase/client').supabase;
  }

  private handleError(error: any, context: string) {
    const errorMessage = error?.message || 'Erro desconhecido';
    console.error(`${context}: ${errorMessage}`, error);
    return {
      data: [],
      error: errorMessage,
      success: false,
      total: 0
    };
  }
}

export const estoqueSobrasService = new EstoqueSobrasService();
