
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { Operador } from '../interfaces';

export class OperadorService extends BaseService<Operador> {
  constructor() {
    super('operadores');
  }

  async getByTurno(turno: string) {
    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('*')
        .eq('turno', turno)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar operadores por turno');
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

export const operadorService = new OperadorService();
