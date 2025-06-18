
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { EstoqueSobra } from '../interfaces';

export class EstoqueSobrasService extends BaseService<EstoqueSobra> {
  constructor() {
    super('estoque_sobras');
  }

  async getByMaterial(materialId: string) {
    try {
      const { data, error } = await supabase
        .from('estoque_sobras' as any)
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
      let query = supabase
        .from('estoque_sobras' as any)
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
      data: { disponivel: false } as any
    });
  }
}

export const estoqueSobrasService = new EstoqueSobrasService();
