
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { Obra } from '../interfaces';

export class ObraService extends BaseService<Obra> {
  constructor() {
    super('obras');
  }

  async getByNome(nome: string) {
    try {
      const { data, error } = await supabase
        .from('obras' as any)
        .select('*')
        .ilike('nome', `%${nome}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar obras por nome');
    }
  }
}

export const obraService = new ObraService();
