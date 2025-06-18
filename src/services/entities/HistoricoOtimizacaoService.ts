
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { HistoricoOtimizacao } from '../interfaces';

export class HistoricoOtimizacaoService extends BaseService<HistoricoOtimizacao> {
  constructor() {
    super('historico_otimizacoes');
  }

  async getByProjeto(projetoId: string) {
    try {
      const { data, error } = await supabase
        .from('historico_otimizacoes')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar histórico por projeto');
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

export const historicoOtimizacaoService = new HistoricoOtimizacaoService();
