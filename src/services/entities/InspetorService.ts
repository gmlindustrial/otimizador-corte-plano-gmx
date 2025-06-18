
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { InspetorQA } from '../interfaces';

export class InspetorService extends BaseService<InspetorQA> {
  constructor() {
    super('inspetores_qa');
  }

  async getByArea(area: string) {
    try {
      const { data, error } = await supabase
        .from('inspetores_qa' as any)
        .select('*')
        .ilike('area', `%${area}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar inspetores por área');
    }
  }
}

export const inspetorService = new InspetorService();
