import { BaseService } from '../base/BaseService';
import { ErrorHandler } from '../base/ErrorHandler';
import type { LaminaUsoCorte, LaminaUsoDetalhado } from '../interfaces/lamina';
import type { ServiceResponse, ListResponse } from '../base/types';

export class LaminaUsoCorteService extends BaseService<LaminaUsoCorte> {
  protected tableName = 'lamina_uso_cortes';
  
  constructor() {
    super('lamina_uso_cortes');
  }

  async registrarCorte(data: Omit<LaminaUsoCorte, 'id' | 'created_at'>): Promise<ServiceResponse<LaminaUsoCorte>> {
    try {
      const { data: resultado, error } = await this.supabase
        .from('lamina_uso_cortes')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      return {
        data: resultado,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao registrar uso da lâmina');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async getHistoricoDetalhado(laminaId: string): Promise<ListResponse<LaminaUsoDetalhado>> {
    try {
      const { data, error } = await this.supabase
        .from('lamina_uso_cortes')
        .select(`
          *,
          projetos!inner(nome),
          operadores(nome),
          projeto_otimizacoes(nome_lista)
        `)
        .eq('lamina_id', laminaId)
        .order('data_corte', { ascending: false });

      if (error) throw error;

      const historico = data?.map(item => ({
        ...item,
        projeto_nome: item.projetos?.nome,
        operador_nome: item.operadores?.nome,
        otimizacao_nome: item.projeto_otimizacoes?.nome_lista
      })) || [];

      return {
        data: historico,
        error: null,
        success: true,
        total: historico.length
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao buscar histórico detalhado da lâmina');
      return {
        data: [],
        error: errorMessage,
        success: false,
        total: 0
      };
    }
  }

  async registrarCorteCompleto(data: {
    lamina_id: string;
    projeto_id: string;
    otimizacao_id?: string;
    peca_id?: string;
    quantidade_cortada: number;
    operador_id?: string;
    observacoes?: string;
    peca_posicao?: string;
    peca_tag?: string;
    perfil_id?: string;
  }): Promise<ServiceResponse<LaminaUsoCorte>> {
    try {
      const { data: usoCorte, error } = await this.supabase
        .from('lamina_uso_cortes')
        .insert([{
          ...data,
          data_corte: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      ErrorHandler.handleSuccess(`Uso da lâmina registrado: ${data.quantidade_cortada} peças cortadas`);

      return {
        data: usoCorte as LaminaUsoCorte,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao registrar uso da lâmina');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async getUsoPorProjeto(projetoId: string): Promise<ListResponse<LaminaUsoDetalhado>> {
    try {
      const { data, error } = await this.supabase
        .from('lamina_uso_cortes')
        .select(`
          *,
          laminas!inner(codigo),
          operadores(nome),
          projeto_pecas(posicao),
          projeto_otimizacoes(nome_lista)
        `)
        .eq('projeto_id', projetoId)
        .order('data_corte', { ascending: false });

      if (error) throw error;

      const uso = data?.map(item => ({
        ...item,
        lamina_codigo: item.laminas?.codigo,
        operador_nome: item.operadores?.nome,
        peca_posicao: item.projeto_pecas?.posicao,
        otimizacao_nome: item.projeto_otimizacoes?.nome_lista
      })) || [];

      return {
        data: uso,
        error: null,
        success: true,
        total: uso.length
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao buscar uso de lâminas no projeto');
      return {
        data: [],
        error: errorMessage,
        success: false,
        total: 0
      };
    }
  }

  async getEstatisticasPorPeriodo(dataInicio: string, dataFim: string): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .from('lamina_uso_cortes')
        .select(`
          lamina_id,
          quantidade_cortada,
          laminas!inner(codigo)
        `)
        .gte('data_corte', dataInicio)
        .lte('data_corte', dataFim);

      if (error) throw error;

      // Agrupar por lâmina
      const estatisticas = data?.reduce((acc, item) => {
        const laminaId = item.lamina_id;
        if (!acc[laminaId]) {
          acc[laminaId] = {
            lamina_id: laminaId,
            lamina_codigo: item.laminas?.codigo,
            total_pecas: 0,
            total_cortes: 0
          };
        }
        acc[laminaId].total_pecas += item.quantidade_cortada;
        acc[laminaId].total_cortes += 1;
        return acc;
      }, {} as Record<string, any>);

      return {
        data: Object.values(estatisticas || {}),
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao buscar estatísticas por período');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }
}

export const laminaUsoCorteService = new LaminaUsoCorteService();