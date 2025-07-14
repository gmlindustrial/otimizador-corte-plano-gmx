
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { LinearOptimizationWithLeftoversResult } from '@/lib/runLinearOptimization';

export class WasteStockService {
  static async addWasteToStock(
    optimizationId: string,
    results: LinearOptimizationWithLeftoversResult,
    perfilId?: string
  ): Promise<void> {
    try {
      console.log('=== ADICIONANDO SOBRAS AO ESTOQUE ===');
      console.log('Optimization ID:', optimizationId);

      // Filtrar sobras > 50mm e criar entradas para o estoque
      const wasteEntries = results.bars
        .filter(bar => bar.waste > 50)
        .map(bar => ({
          comprimento: Math.floor(bar.waste),
          quantidade: 1,
          id_projeto_otimizacao: optimizationId,
          id_perfis_materiais: perfilId
        }));

      console.log('Sobras para adicionar:', wasteEntries);

      if (wasteEntries.length > 0) {
        const { data, error } = await supabase
          .from('estoque_sobras')
          .insert(wasteEntries)
          .select();

        if (error) {
          console.error('Erro ao inserir sobras:', error);
          throw error;
        }

        console.log('Sobras inseridas com sucesso:', data);
        console.log(`${wasteEntries.length} sobras adicionadas automaticamente ao estoque`);
        toast.success(`${wasteEntries.length} sobras adicionadas ao estoque automaticamente`);
      } else {
        console.log('Nenhuma sobra > 50mm encontrada para adicionar ao estoque');
      }
    } catch (error) {
      console.error('Erro ao adicionar sobras ao estoque:', error);
      toast.error('Erro ao adicionar sobras ao estoque');
    }
  }
}
