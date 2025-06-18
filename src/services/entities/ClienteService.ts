
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { Cliente } from '../interfaces';

export class ClienteService extends BaseService<Cliente> {
  constructor() {
    super('clientes');
  }

  async getByNome(nome: string) {
    try {
      const { data, error } = await supabase
        .from('clientes' as any)
        .select('*')
        .ilike('nome', `%${nome}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar clientes por nome');
    }
  }
}

export const clienteService = new ClienteService();
