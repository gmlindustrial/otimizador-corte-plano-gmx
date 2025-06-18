
import { BaseService } from '../base/BaseService';
import type { Material } from '../interfaces';

export class MaterialService extends BaseService<Material> {
  constructor() {
    super('materiais');
  }

  async getByTipo(tipo: string) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .ilike('tipo', `%${tipo}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar materiais por tipo');
    }
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

export const materialService = new MaterialService();
