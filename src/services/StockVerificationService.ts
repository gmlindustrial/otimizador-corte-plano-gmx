/**
 * StockVerificationService — Verifica se as barras necessárias existem no estoque
 * antes de executar a otimização (G13).
 */

import { supabase } from '@/integrations/supabase/client';

export interface StockVerificationResult {
  isAvailable: boolean;
  barsNeeded: number;
  barsInStock: number;
  deficit: number;
  materialId?: string;
  materialDescription?: string;
}

export class StockVerificationService {
  /**
   * Verifica disponibilidade de barras no estoque para um material específico.
   * Retorna resultado indicando se há estoque suficiente.
   */
  static async verifyStock(
    materialId: string | undefined,
    barsNeeded: number
  ): Promise<StockVerificationResult> {
    if (!materialId) {
      // Sem material definido, não podemos verificar estoque
      return {
        isAvailable: true,
        barsNeeded,
        barsInStock: 0,
        deficit: 0,
      };
    }

    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('id, tipo, quantidade')
        .eq('id', materialId)
        .single();

      if (error || !data) {
        console.warn('Não foi possível verificar estoque:', error?.message);
        return {
          isAvailable: true, // Não bloquear se não conseguir verificar
          barsNeeded,
          barsInStock: 0,
          deficit: 0,
          materialId,
        };
      }

      const barsInStock = data.quantidade || 0;
      const deficit = Math.max(0, barsNeeded - barsInStock);

      return {
        isAvailable: deficit === 0,
        barsNeeded,
        barsInStock,
        deficit,
        materialId,
        materialDescription: data.tipo,
      };
    } catch (error) {
      console.error('Erro ao verificar estoque:', error);
      return {
        isAvailable: true, // Não bloquear em caso de erro
        barsNeeded,
        barsInStock: 0,
        deficit: 0,
        materialId,
      };
    }
  }

  /**
   * Estima quantas barras serão necessárias baseado nas peças.
   */
  static estimateBarsNeeded(
    pieces: Array<{ length: number; quantity: number }>,
    barLength: number,
    cutLoss: number = 3
  ): number {
    const totalMaterial = pieces.reduce(
      (sum, p) => sum + (p.length + cutLoss) * p.quantity,
      0
    );
    return Math.ceil(totalMaterial / barLength);
  }
}
