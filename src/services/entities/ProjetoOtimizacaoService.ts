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

      const cutPieceIds: string[] = [];
      
      // Extrair IDs de peças marcadas como cortadas dos resultados
      results.bars.forEach((bar: any) => {
        if (bar.pieces) {
          bar.pieces.forEach((piece: any) => {
            if (piece.cortada === true && piece.id) {
              cutPieceIds.push(piece.id);
            }
          });
        }
      });

      if (cutPieceIds.length > 0) {
        // Atualizar a coluna corte para true nas peças identificadas
        const { error: updateError } = await supabase
          .from('projeto_pecas')
          .update({ corte: true })
          .in('id', cutPieceIds)
          .eq('projeto_id', optimization.projeto_id);

        if (updateError) throw updateError;

        // Também atualizar peças que não estão na lista como não cortadas
        const { error: resetError } = await supabase
          .from('projeto_pecas')
          .update({ corte: false })
          .not('id', 'in', `(${cutPieceIds.map(() => '?').join(',')})`)
          .eq('projeto_otimizacao_id', optimizationId);

        if (resetError) throw resetError;
      }

      return { success: true, data: { syncedPieces: cutPieceIds.length }, error: null };
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
