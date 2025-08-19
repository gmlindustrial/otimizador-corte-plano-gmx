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
          projeto_otimizacao_id: null,
          corte: false
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

  async syncCutPiecesFromResults(optimizationId: string) {
    try {
      // Buscar a otimização e seus resultados
      const { data: optimization, error: fetchError } = await supabase
        .from('projeto_otimizacoes')
        .select('resultados, projeto_id')
        .eq('id', optimizationId)
        .single();

      if (fetchError) throw fetchError;

      const results = optimization?.resultados as any;
      if (!results?.bars) {
        return { success: true, data: null, error: null };
      }

      // Primeiro, resetar todas as peças desta otimização como não cortadas
      const { error: resetError } = await supabase
        .from('projeto_pecas')
        .update({ corte: false })
        .eq('projeto_otimizacao_id', optimizationId);

      if (resetError) throw resetError;

      const cutPieces: Array<{ tag: string, posicao: string }> = [];
      
      // Extrair tag e posição de peças marcadas como cortadas dos resultados
      results.bars.forEach((bar: any) => {
        if (bar.pieces) {
          bar.pieces.forEach((piece: any) => {
            if (piece.cortada === true && piece.tag && piece.posicao) {
              cutPieces.push({
                tag: piece.tag,
                posicao: piece.posicao
              });
            }
          });
        }
      });

      let syncedCount = 0;

      // Atualizar peças cortadas usando tag e posição
      for (const piece of cutPieces) {
        const { error: updateError } = await supabase
          .from('projeto_pecas')
          .update({ corte: true })
          .eq('projeto_otimizacao_id', optimizationId)
          .eq('tag', piece.tag)
          .eq('posicao', piece.posicao);

        if (!updateError) {
          syncedCount++;
        }
      }

      return { success: true, data: { syncedPieces: syncedCount }, error: null };
    } catch (error: any) {
      console.error('Erro ao sincronizar peças cortadas:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async syncAllCutPieces() {
    try {
      // Buscar todas as otimizações que têm resultados
      const { data: optimizations, error: fetchError } = await supabase
        .from('projeto_otimizacoes')
        .select('id, resultados, projeto_id')
        .not('resultados', 'is', null);

      if (fetchError) throw fetchError;

      let totalSynced = 0;

      for (const optimization of optimizations || []) {
        const result = await this.syncCutPiecesFromResults(optimization.id);
        if (result.success && result.data) {
          totalSynced += result.data.syncedPieces;
        }
      }

      return { success: true, data: { totalSynced }, error: null };
    } catch (error: any) {
      console.error('Erro ao sincronizar todas as peças cortadas:', error);
      return { success: false, data: null, error: error.message };
    }
  }
}

export const projetoOtimizacaoService = new ProjetoOtimizacaoService();
