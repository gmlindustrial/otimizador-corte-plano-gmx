
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
        .from('inspetores_qa')
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

  private handleError(error: any, context: string) {
    const errorMessage = error?.message || 'Erro desconhecido';
    console.error(`${context}: ${errorMessage}`, error);
    return {
      data: [],
      error: errorMessage,
      success: false,
      total: 0
    };
  }
}

export const inspetorService = new InspetorService();
