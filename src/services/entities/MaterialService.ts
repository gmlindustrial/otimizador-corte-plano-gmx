
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { Material } from '../interfaces';

export class MaterialService extends BaseService<Material> {
  constructor() {
    super('materiais');
  }

  async getByTipo(tipo: string) {
    try {
      const { data, error } = await supabase
        .from('materiais' as any)
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
}

export const materialService = new MaterialService();
