import { BaseService } from '../base/BaseService';
import { ErrorHandler } from '../base/ErrorHandler';
import type { SerraUsoCorte, SerraUsoDetalhado } from '../interfaces/serra';
import type { ServiceResponse, ListResponse } from '../base/types';

export class SerraUsoCorteService extends BaseService<SerraUsoCorte> {
  protected tableName = 'serra_uso_cortes';
  
  constructor() {
    super('serra_uso_cortes');
  }

  async registrarCorte(data: Omit<SerraUsoCorte, 'id' | 'created_at'>): Promise<ServiceResponse<SerraUsoCorte>> {
    try {
      const { data: resultado, error } = await this.supabase
        .from('serra_uso_cortes')
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
      const errorMessage = ErrorHandler.handle(error, 'Erro ao registrar uso da serra');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async getHistoricoDetalhado(serraId: string): Promise<ListResponse<SerraUsoDetalhado>> {
    try {
      const { data, error } = await this.supabase
        .from('serra_uso_cortes')
        .select(`
          *,
          projetos!inner(nome),
          operadores(nome),
          projeto_pecas(posicao),
          projeto_otimizacoes(nome_lista)
        `)
        .eq('serra_id', serraId)
        .order('data_corte', { ascending: false });

      if (error) throw error;

      const historico = data?.map(item => ({
        ...item,
        projeto_nome: item.projetos?.nome,
        operador_nome: item.operadores?.nome,
        peca_posicao: item.projeto_pecas?.posicao,
        otimizacao_nome: item.projeto_otimizacoes?.nome_lista
      })) || [];

      return {
        data: historico,
        error: null,
        success: true,
        total: historico.length
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao buscar histórico detalhado da serra');
      return {
        data: [],
        error: errorMessage,
        success: false,
        total: 0
      };
    }
  }

  async getUsoPorProjeto(projetoId: string): Promise<ListResponse<SerraUsoDetalhado>> {
    try {
      const { data, error } = await this.supabase
        .from('serra_uso_cortes')
        .select(`
          *,
          serras!inner(codigo),
          operadores(nome),
          projeto_pecas(posicao),
          projeto_otimizacoes(nome_lista)
        `)
        .eq('projeto_id', projetoId)
        .order('data_corte', { ascending: false });

      if (error) throw error;

      const uso = data?.map(item => ({
        ...item,
        serra_codigo: item.serras?.codigo,
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
      const errorMessage = ErrorHandler.handle(error, 'Erro ao buscar uso de serras no projeto');
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
        .from('serra_uso_cortes')
        .select(`
          serra_id,
          quantidade_cortada,
          serras!inner(codigo)
        `)
        .gte('data_corte', dataInicio)
        .lte('data_corte', dataFim);

      if (error) throw error;

      // Agrupar por serra
      const estatisticas = data?.reduce((acc, item) => {
        const serraId = item.serra_id;
        if (!acc[serraId]) {
          acc[serraId] = {
            serra_id: serraId,
            serra_codigo: item.serras?.codigo,
            total_pecas: 0,
            total_cortes: 0
          };
        }
        acc[serraId].total_pecas += item.quantidade_cortada;
        acc[serraId].total_cortes += 1;
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

export const serraUsoCorteService = new SerraUsoCorteService();