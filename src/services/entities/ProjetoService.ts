
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { Projeto } from '../interfaces';

export class ProjetoService extends BaseService<Projeto> {
  constructor() {
    super('projetos');
  }

  async getByCliente(clienteId: string) {
    try {
      const { data, error } = await supabase
        .from('projetos' as any)
        .select(`
          *,
          clientes (nome),
          obras (nome),
          operadores (nome),
          inspetores_qa (nome),
          materiais (tipo)
        `)
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar projetos por cliente');
    }
  }

  async getByObra(obraId: string) {
    try {
      const { data, error } = await supabase
        .from('projetos' as any)
        .select(`
          *,
          clientes (nome),
          obras (nome),
          operadores (nome),
          inspetores_qa (nome),
          materiais (tipo)
        `)
        .eq('obra_id', obraId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar projetos por obra');
    }
  }

  async getWithRelations(id: string) {
    try {
      const { data, error } = await supabase
        .from('projetos' as any)
        .select(`
          *,
          clientes (nome),
          obras (nome),
          operadores (nome),
          inspetores_qa (nome),
          materiais (tipo)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data: data || null,
        error: null,
        success: true
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar projeto com relações');
    }
  }
}

export const projetoService = new ProjetoService();
