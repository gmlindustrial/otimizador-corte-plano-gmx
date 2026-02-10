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
      // 1. Deletar registros de uso de lâmina/serra que referenciam esta otimização
      // Tentar com o nome atual da tabela (serra_uso_cortes)
      const { error: serraError } = await supabase
        .from('serra_uso_cortes')
        .delete()
        .eq('otimizacao_id', optimizationId);

      if (serraError) {
        console.warn('Aviso ao deletar serra_uso_cortes:', serraError.message);
        // Se falhar, pode ser que a tabela foi renomeada para lamina_uso_cortes
        // ou simplesmente não há registros - ignorar e continuar
      }

      // 2. Deletar registros de emendas que referenciam esta otimização
      const { error: emendaError } = await supabase
        .from('emendas_otimizacao')
        .delete()
        .eq('projeto_otimizacao_id', optimizationId);

      if (emendaError) {
        console.warn('Aviso ao deletar emendas_otimizacao:', emendaError.message);
        // Ignorar se não existem registros
      }

      // 3. Retornar todas as peças desta otimização para status 'aguardando_otimizacao'
      const { error: updateError } = await supabase
        .from('projeto_pecas')
        .update({
          status: 'aguardando_otimizacao',
          projeto_otimizacao_id: null,
          corte: false
        })
        .eq('projeto_otimizacao_id', optimizationId);

      if (updateError) throw updateError;

      // 4. Por fim, deletar a otimização
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

      // Interface para chave de sincronizacao
      interface CutPieceSyncKey {
        id?: string;
        tag?: string;
        posicao?: string;
        comprimento_mm?: number;
        perfil_id?: string;
      }

      const cutPieces: CutPieceSyncKey[] = [];

      // Extrair informacoes de pecas marcadas como cortadas dos resultados
      // CORRIGIDO: Usar ID quando disponivel, senao usar chave composta
      results.bars.forEach((bar: any) => {
        if (bar.pieces) {
          bar.pieces.forEach((piece: any) => {
            if (piece.cortada === true) {
              cutPieces.push({
                id: piece.id, // PREFERENCIAL: usar ID diretamente
                tag: piece.tag,
                posicao: piece.posicao,
                comprimento_mm: piece.length,
                perfil_id: piece.perfilId || piece.perfil_id
              });
            }
          });
        }
      });

      let syncedCount = 0;

      // Atualizar peças cortadas usando a melhor chave disponivel
      for (const piece of cutPieces) {
        let query = supabase
          .from('projeto_pecas')
          .update({ corte: true });

        // PREFERENCIAL: Usar ID da peca se disponivel (mais preciso)
        if (piece.id) {
          query = query.eq('id', piece.id);
        } else {
          // FALLBACK: Usar chave composta para identificacao unica
          query = query.eq('projeto_otimizacao_id', optimizationId);

          if (piece.tag) {
            query = query.eq('tag', piece.tag);
          }
          if (piece.posicao) {
            query = query.eq('posicao', piece.posicao);
          }
          // CRITICO: Incluir comprimento para diferenciar pecas com mesma tag/posicao
          if (piece.comprimento_mm) {
            query = query.eq('comprimento_mm', piece.comprimento_mm);
          }
          // Incluir perfil se disponivel
          if (piece.perfil_id) {
            query = query.eq('perfil_id', piece.perfil_id);
          }
        }

        const { error: updateError } = await query;

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
