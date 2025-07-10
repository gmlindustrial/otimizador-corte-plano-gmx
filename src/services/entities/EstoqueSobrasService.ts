import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { EstoqueSobra } from '../interfaces';

export class EstoqueSobrasService extends BaseService<EstoqueSobra> {
  constructor() {
    super('estoque_sobras');
  }

  async useQuantity(id: string, qty: number) {
    try {
      const { data, error } = await supabase
        .from('estoque_sobras')
        .select('quantidade')
        .eq('id', id)
        .single();
      if (error) throw error;
      const newQty = (data?.quantidade || 0) - qty;
      if (newQty <= 0) {
        const { error: delErr } = await supabase
          .from('estoque_sobras')
          .delete()
          .eq('id', id);
        if (delErr) throw delErr;
      } else {
        const { error: updErr } = await supabase
          .from('estoque_sobras')
          .update({ quantidade: newQty })
          .eq('id', id);
        if (updErr) throw updErr;
      }
      return { success: true, data: null, error: null };
    } catch (error: any) {
      return this.handleError(error, 'Erro ao atualizar quantidade da sobra');
    }
  }
}

export const estoqueSobrasService = new EstoqueSobrasService();
