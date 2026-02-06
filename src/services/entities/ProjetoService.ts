
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { Projeto } from '../interfaces';
import { auditService } from '../AuditService';

export class ProjetoService extends BaseService<Projeto> {
  constructor() {
    super('projetos');
  }

  // Métodos específicos com logging de auditoria
  async createWithAudit(data: Omit<Projeto, 'id' | 'created_at'>): Promise<{ data?: Projeto; error?: any; success: boolean }> {
    try {
      const { data: projeto, error } = await supabase
        .from('projetos')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      // Log da ação
      if (projeto) {
        await auditService.logProjectAction(
          'CRIAR',
          projeto.id,
          projeto.nome,
          { projeto }
        );
      }

      return { data: projeto, success: true };
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      return { error, success: false };
    }
  }

  async updateWithAudit(id: string, data: Partial<Projeto>): Promise<{ data?: Projeto; error?: any; success: boolean }> {
    try {
      const { data: projeto, error } = await supabase
        .from('projetos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log da ação
      if (projeto) {
        await auditService.logProjectAction(
          'EDITAR',
          projeto.id,
          projeto.nome,
          { updates: data }
        );
      }

      return { data: projeto, success: true };
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      return { error, success: false };
    }
  }

  async deleteWithAudit(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      // Buscar dados do projeto antes de deletar
      const { data: projeto } = await supabase
        .from('projetos')
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log da ação
      if (projeto) {
        await auditService.logProjectAction(
          'EXCLUIR',
          id,
          projeto.nome,
          { deletedProject: projeto }
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      return { success: false, error };
    }
  }

  async getAllWithCounts() {
    try {
      // Buscar projetos com relações básicas
      const { data, error } = await supabase
        .from('projetos' as any)
        .select(`
          *,
          clientes (nome),
          obras (nome),
          projeto_pecas!left (id, quantidade),
          projeto_otimizacoes!left (id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar contagem de otimizações de chapas separadamente (tabela sem FK)
      const projectIds = (data || []).map((p: any) => p.id);
      let sheetOptimizationCounts: Record<string, number> = {};

      if (projectIds.length > 0) {
        const { data: sheetOpts } = await supabase
          .from('sheet_optimization_history')
          .select('project_id')
          .in('project_id', projectIds);

        // Contar otimizações por projeto
        (sheetOpts || []).forEach((opt: any) => {
          sheetOptimizationCounts[opt.project_id] = (sheetOptimizationCounts[opt.project_id] || 0) + 1;
        });
      }

      const mapped = (data || []).map((p: any) => {
        const totalPecas = p.projeto_pecas?.length || 0;
        const totalQuantidadePecas = p.projeto_pecas?.reduce((sum: number, peca: any) => sum + (peca.quantidade || 0), 0) || 0;
        const totalOtimizacoesBarras = p.projeto_otimizacoes?.length || 0;
        const totalOtimizacoesChapas = sheetOptimizationCounts[p.id] || 0;
        const totalOtimizacoes = totalOtimizacoesBarras + totalOtimizacoesChapas;

        return {
          ...p,
          _count: {
            projeto_pecas: totalPecas,
            projeto_otimizacoes: totalOtimizacoesBarras,
            sheet_optimization_history: totalOtimizacoesChapas
          },
          _stats: {
            total_pecas_individuais: totalPecas,
            total_quantidade_pecas: totalQuantidadePecas,
            total_otimizacoes: totalOtimizacoes,
            total_otimizacoes_barras: totalOtimizacoesBarras,
            total_otimizacoes_chapas: totalOtimizacoesChapas
          }
        };
      });

      return {
        data: mapped,
        error: null,
        success: true,
        total: mapped.length
      };
    } catch (error) {
      return this.handleError(error, 'Erro ao buscar projetos');
    }
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
