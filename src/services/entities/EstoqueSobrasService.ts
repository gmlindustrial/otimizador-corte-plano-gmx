import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { EstoqueSobra } from '../interfaces';

export class EstoqueSobrasService extends BaseService<EstoqueSobra> {
  constructor() {
    super('estoque_sobras');
  }

  async useQuantity(id: string, qty: number) {
    try {
      console.log(`=== USEQUANTITY: ${id}, qty: ${qty} ===`);
      
      // Validar entrada
      if (!id || qty <= 0) {
        console.warn(`Parâmetros inválidos: id=${id}, qty=${qty}`);
        return { success: false, data: null, error: 'Parâmetros inválidos' };
      }
      
      const { data, error } = await supabase
        .from('estoque_sobras')
        .select('quantidade, comprimento, id_perfis_materiais')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error(`Sobra não encontrada: ${id}`, error);
        throw error;
      }
      
      console.log(`Sobra encontrada: ${JSON.stringify(data)}`);
      
      const currentQty = data?.quantidade || 0;
      if (qty > currentQty) {
        console.warn(`Tentativa de usar mais que disponível: ${qty} > ${currentQty}`);
        return { success: false, data: null, error: 'Quantidade insuficiente' };
      }
      
      const newQty = currentQty - qty;
      console.log(`Nova quantidade: ${currentQty} - ${qty} = ${newQty}`);
      
      if (newQty <= 0) {
        console.log(`Deletando sobra ${id} (quantidade zerada)`);
        const { error: delErr } = await supabase
          .from('estoque_sobras')
          .delete()
          .eq('id', id);
        if (delErr) throw delErr;
      } else {
        console.log(`Atualizando sobra ${id} para quantidade ${newQty}`);
        const { error: updErr } = await supabase
          .from('estoque_sobras')
          .update({ quantidade: newQty })
          .eq('id', id);
        if (updErr) throw updErr;
      }
      return { success: true, data: null, error: null };
    } catch (error: any) {
      console.error('Erro em useQuantity:', error);
      return this.handleError(error, 'Erro ao atualizar quantidade da sobra');
    }
  }
}

export const estoqueSobrasService = new EstoqueSobrasService();
