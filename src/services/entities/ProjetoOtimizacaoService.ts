import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { ProjetoOtimizacao } from '@/types/project';

export class ProjetoOtimizacaoService extends BaseService<ProjetoOtimizacao> {
  constructor() {
    super('projeto_otimizacoes');
  }

  async getByProjectId(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('projeto_otimizacoes')
        .select('*')
        .eq('projeto_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [], error: null };
    } catch (error: any) {
      console.error('Erro ao buscar otimizações do projeto:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async reverseOptimization(optimizationId: string) {
    try {
      // Primeiro, retornar todas as peças desta otimização para status 'aguardando_otimizacao'
      const { error: updateError } = await supabase
        .from('projeto_pecas')
        .update({ 
          status: 'aguardando_otimizacao',
          projeto_otimizacao_id: null 
        })
        .eq('projeto_otimizacao_id', optimizationId);

      if (updateError) throw updateError;

      // Depois, deletar a otimização
      const { error: deleteError } = await supabase
        .from('projeto_otimizacoes')
        .delete()
        .eq('id', optimizationId);

      if (deleteError) throw deleteError;

      return { success: true, data: null, error: null };
    } catch (error: any) {
      console.error('Erro ao reverter otimização:', error);
      return { success: false, data: null, error: error.message };
    }
  }
}

export const projetoOtimizacaoService = new ProjetoOtimizacaoService();
