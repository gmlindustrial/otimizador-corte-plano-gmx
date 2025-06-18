
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { Projeto } from '../interfaces';

export class ProjetoService extends BaseService<Projeto> {
  constructor() {
    super('projetos');
  }

  async getByCliente(clienteId: string) {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar projetos por cliente');
    }
  }

  async getByObra(obraId: string) {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('obra_id', obraId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar projetos por obra');
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

export const projetoService = new ProjetoService();
