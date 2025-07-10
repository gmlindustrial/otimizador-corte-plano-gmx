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
}

export const projetoOtimizacaoService = new ProjetoOtimizacaoService();
