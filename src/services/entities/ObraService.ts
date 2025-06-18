
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
        .from('obras')
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

export const obraService = new ObraService();
