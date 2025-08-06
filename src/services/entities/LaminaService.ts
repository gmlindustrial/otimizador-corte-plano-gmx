import { BaseService } from '../base/BaseService';
import { ErrorHandler } from '../base/ErrorHandler';
import type { Lamina, LaminaEstatisticas, LaminaSubstituicao, LaminaStatusHistorico } from '../interfaces/lamina';
import type { ServiceResponse, ListResponse } from '../base/types';

export class LaminaService extends BaseService<Lamina> {
  protected tableName = 'serras';
  
  constructor() {
    super('serras');
  }

  async create(request: { data: Omit<Lamina, 'id' | 'created_at'> }): Promise<ServiceResponse<Lamina>> {
    try {
      const { data } = request;
      
      // Se a nova lâmina está sendo criada como ativada, desativar todas as outras primeiro
      if (data.status === 'ativada') {
        await this.supabase
          .from('serras')
          .update({ 
            status: 'desativada',
            updated_at: new Date().toISOString() 
          })
          .eq('status', 'ativada');
      }

      // Criar a nova lâmina
      const { data: novaLamina, error } = await this.supabase
        .from('serras')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      // Se foi criada como ativada, registrar no histórico
      if (data.status === 'ativada') {
        await this.supabase
          .from('serra_status_historico')
          .insert([{
            serra_id: novaLamina.id,
            status_anterior: null,
            status_novo: 'ativada',
            data_mudanca: new Date().toISOString(),
            motivo: 'Lâmina criada como ativada'
          }]);

        ErrorHandler.handleSuccess('Lâmina criada e ativada com sucesso');
      } else {
        ErrorHandler.handleSuccess('Lâmina criada com sucesso');
      }

      return {
        data: novaLamina as Lamina,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao criar lâmina');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async getAtivadas(): Promise<ListResponse<Lamina>> {
    try {
      const { data, error } = await this.supabase
        .from('serras')
        .select('*')
        .eq('status', 'ativada')
        .order('codigo', { ascending: true });

      if (error) throw error;

      return {
        data: (data || []) as Lamina[],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao buscar lâminas ativadas');
      return {
        data: [],
        error: errorMessage,
        success: false,
        total: 0
      };
    }
  }

  async getEstatisticas(laminaId: string): Promise<ServiceResponse<LaminaEstatisticas>> {
    try {
      // Buscar dados da lâmina
      const { data: lamina, error: laminaError } = await this.supabase
        .from('serras')
        .select('*')
        .eq('id', laminaId)
        .single();

      if (laminaError) throw laminaError;

      // Buscar uso de cortes
      const { data: usoCortes, error: usoError } = await this.supabase
        .from('serra_uso_cortes')
        .select(`
          *,
          projetos!inner(nome),
          projeto_otimizacoes(nome_lista)
        `)
        .eq('serra_id', laminaId)
        .order('data_corte', { ascending: false });

      if (usoError) throw usoError;

      // Buscar histórico de status
      const { data: statusHistorico, error: statusError } = await this.supabase
        .from('serra_status_historico')
        .select('*')
        .eq('serra_id', laminaId)
        .order('data_mudanca', { ascending: false });

      if (statusError) throw statusError;

      // Buscar substituições
      const { data: substituicoes, error: substituicoesError } = await this.supabase
        .from('serra_substituicoes')
        .select('*')
        .or(`serra_anterior_id.eq.${laminaId},serra_nova_id.eq.${laminaId}`)
        .order('data_substituicao', { ascending: false });

      if (substituicoesError) throw substituicoesError;

      // Calcular estatísticas
      const totalPecasCortadas = usoCortes?.reduce((acc, uso) => acc + uso.quantidade_cortada, 0) || 0;
      const projetosUnicos = new Set(usoCortes?.map(uso => uso.projeto_id) || []);
      const primeiroUso = usoCortes?.[usoCortes.length - 1]?.data_corte;
      const ultimoUso = usoCortes?.[0]?.data_corte;

      // Agrupar projetos
      const projetosDetalhados = usoCortes?.reduce((acc, uso) => {
        const projetoId = uso.projeto_id;
        if (!acc[projetoId]) {
          acc[projetoId] = {
            projeto_id: projetoId,
            projeto_nome: uso.projetos?.nome || 'Projeto sem nome',
            listas_otimizacao: [],
            total_pecas_projeto: 0,
            data_primeiro_uso: uso.data_corte,
            data_ultimo_uso: uso.data_corte
          };
        }

        const otimizacaoId = uso.otimizacao_id;
        if (otimizacaoId) {
          const listaExistente = acc[projetoId].listas_otimizacao.find(l => l.otimizacao_id === otimizacaoId);
          if (listaExistente) {
            listaExistente.quantidade_cortada += uso.quantidade_cortada;
          } else {
            acc[projetoId].listas_otimizacao.push({
              otimizacao_id: otimizacaoId,
              nome_lista: uso.projeto_otimizacoes?.nome_lista || 'Lista sem nome',
              quantidade_cortada: uso.quantidade_cortada,
              data_corte: uso.data_corte
            });
          }
        }

        acc[projetoId].total_pecas_projeto += uso.quantidade_cortada;
        
        if (uso.data_corte < acc[projetoId].data_primeiro_uso) {
          acc[projetoId].data_primeiro_uso = uso.data_corte;
        }
        if (uso.data_corte > acc[projetoId].data_ultimo_uso) {
          acc[projetoId].data_ultimo_uso = uso.data_corte;
        }

        return acc;
      }, {} as Record<string, any>) || {};

      // Calcular métricas de tempo
      const dataCriacao = lamina.created_at;
      const dataInstalacao = lamina.data_instalacao;
      
      const historicoOrdenado = statusHistorico?.sort((a, b) => 
        new Date(a.data_mudanca).getTime() - new Date(b.data_mudanca).getTime()
      ) || [];

      const primeiraAtivacao = historicoOrdenado.find(h => h.status_novo === 'ativada')?.data_mudanca;
      const ultimaAtivacao = historicoOrdenado.filter(h => h.status_novo === 'ativada').pop()?.data_mudanca;
      const ultimaDesativacao = historicoOrdenado.filter(h => h.status_novo === 'desativada').pop()?.data_mudanca;
      const dataDescarte = historicoOrdenado.find(h => h.status_novo === 'descartada')?.data_mudanca;

      // Calcular tempo total ativo/inativo
      let tempoTotalAtivoDias = 0;
      let tempoTotalInativoDias = 0;

      if (historicoOrdenado.length > 0) {
        let statusAtual = 'ativada'; // Status inicial
        let inicioStatusAtual = new Date(dataInstalacao);
        let agora = new Date();

        for (const mudanca of historicoOrdenado) {
          const dataMudanca = new Date(mudanca.data_mudanca);
          const diffDias = (dataMudanca.getTime() - inicioStatusAtual.getTime()) / (1000 * 60 * 60 * 24);

          if (statusAtual === 'ativada') {
            tempoTotalAtivoDias += diffDias;
          } else {
            tempoTotalInativoDias += diffDias;
          }

          statusAtual = mudanca.status_novo;
          inicioStatusAtual = dataMudanca;
        }

        // Adicionar tempo desde a última mudança até agora
        const diffFinalDias = (agora.getTime() - inicioStatusAtual.getTime()) / (1000 * 60 * 60 * 24);
        if (statusAtual === 'ativada') {
          tempoTotalAtivoDias += diffFinalDias;
        } else {
          tempoTotalInativoDias += diffFinalDias;
        }
      }

      const estatisticas: LaminaEstatisticas = {
        lamina: lamina as Lamina,
        total_pecas_cortadas: totalPecasCortadas,
        projetos_utilizados: projetosUnicos.size,
        primeiro_uso: primeiroUso,
        ultimo_uso: ultimoUso,
        substituicoes: substituicoes || [],
        historico_status: statusHistorico || [],
        projetos_detalhados: Object.values(projetosDetalhados),
        metricas_tempo: {
          data_criacao: dataCriacao,
          data_primeira_ativacao: primeiraAtivacao,
          data_ultima_ativacao: ultimaAtivacao,
          data_ultima_desativacao: ultimaDesativacao,
          data_descarte: dataDescarte,
          tempo_total_ativo_dias: Math.round(tempoTotalAtivoDias * 100) / 100,
          tempo_total_inativo_dias: Math.round(tempoTotalInativoDias * 100) / 100
        }
      };

      return {
        data: estatisticas,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao buscar estatísticas da lâmina');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async ativar(laminaId: string, operadorId?: string, motivo?: string): Promise<ServiceResponse<Lamina>> {
    try {
      // Primeiro, desativar todas as lâminas ativas
      await this.supabase
        .from('serras')
        .update({ 
          status: 'desativada',
          updated_at: new Date().toISOString() 
        })
        .eq('status', 'ativada');

      // Ativar a lâmina selecionada
      const { data: lamina, error } = await this.supabase
        .from('serras')
        .update({ 
          status: 'ativada',
          updated_at: new Date().toISOString() 
        })
        .eq('id', laminaId)
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await this.supabase
        .from('serra_status_historico')
        .insert([{
          serra_id: laminaId,
          status_anterior: 'desativada',
          status_novo: 'ativada',
          data_mudanca: new Date().toISOString(),
          motivo: motivo || 'Ativação manual',
          operador_id: operadorId
        }]);

      ErrorHandler.handleSuccess('Lâmina ativada com sucesso');

      return {
        data: lamina as Lamina,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao ativar lâmina');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async desativar(laminaId: string, operadorId?: string, motivo?: string): Promise<ServiceResponse<Lamina>> {
    try {
      const { data: lamina, error } = await this.supabase
        .from('serras')
        .update({ 
          status: 'desativada',
          updated_at: new Date().toISOString() 
        })
        .eq('id', laminaId)
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await this.supabase
        .from('serra_status_historico')
        .insert([{
          serra_id: laminaId,
          status_anterior: 'ativada',
          status_novo: 'desativada',
          data_mudanca: new Date().toISOString(),
          motivo: motivo || 'Desativação manual',
          operador_id: operadorId
        }]);

      ErrorHandler.handleSuccess('Lâmina desativada com sucesso');

      return {
        data: lamina as Lamina,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao desativar lâmina');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async descartar(laminaId: string, motivo: string, operadorId?: string): Promise<ServiceResponse<Lamina>> {
    try {
      const { data: lamina, error } = await this.supabase
        .from('serras')
        .update({ 
          status: 'descartada',
          updated_at: new Date().toISOString() 
        })
        .eq('id', laminaId)
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await this.supabase
        .from('serra_status_historico')
        .insert([{
          serra_id: laminaId,
          status_anterior: lamina.status,
          status_novo: 'descartada',
          data_mudanca: new Date().toISOString(),
          motivo,
          operador_id: operadorId
        }]);

      // Registrar como substituição por ela mesma (descarte)
      await this.supabase
        .from('serra_substituicoes')
        .insert([{
          serra_anterior_id: laminaId,
          serra_nova_id: laminaId,
          data_substituicao: new Date().toISOString(),
          motivo,
          operador_id: operadorId,
          observacoes: 'Lâmina descartada'
        }]);

      ErrorHandler.handleSuccess('Lâmina descartada com sucesso');

      return {
        data: lamina as Lamina,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao descartar lâmina');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }
}

export const laminaService = new LaminaService();