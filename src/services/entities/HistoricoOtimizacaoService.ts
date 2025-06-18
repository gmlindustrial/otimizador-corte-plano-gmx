
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
        .from('historico_otimizacoes' as any)
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
}

export const historicoOtimizacaoService = new HistoricoOtimizacaoService();
