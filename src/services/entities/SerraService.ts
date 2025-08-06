import { BaseService } from '../base/BaseService';
import { ErrorHandler } from '../base/ErrorHandler';
import type { Serra, SerraEstatisticas } from '../interfaces/serra';
import type { ServiceResponse, ListResponse, CreateRequest, UpdateRequest } from '../base/types';

export class SerraService extends BaseService<Serra> {
  protected tableName = 'serras';
  
  constructor() {
    super('serras');
  }

  async getAtivadas(): Promise<ListResponse<Serra>> {
    try {
      const { data, error } = await this.supabase
        .from('serras')
        .select('*')
        .eq('status', 'ativada')
        .order('codigo');

      if (error) throw error;

      return {
        data: (data as Serra[]) || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao buscar serras ativadas');
      return {
        data: [],
        error: errorMessage,
        success: false,
        total: 0
      };
    }
  }

  async getEstatisticas(serraId: string): Promise<ServiceResponse<SerraEstatisticas>> {
    try {
      // Buscar dados da serra
      const { data: serra, error: serraError } = await this.supabase
        .from('serras')
        .select('*')
        .eq('id', serraId)
        .single();

      if (serraError) throw serraError;

      // Buscar histórico de status
      const { data: historicoStatus, error: historicoError } = await this.supabase
        .from('serra_status_historico')
        .select(`
          *,
          operadores(nome)
        `)
        .eq('serra_id', serraId)
        .order('data_mudanca', { ascending: true });

      if (historicoError) throw historicoError;

      // Buscar dados detalhados de uso com projetos e otimizações
      const { data: usoDetalhado, error: usoError } = await this.supabase
        .from('serra_uso_cortes')
        .select(`
          quantidade_cortada,
          data_corte,
          projeto_id,
          otimizacao_id,
          projetos(nome),
          projeto_otimizacoes(nome_lista)
        `)
        .eq('serra_id', serraId)
        .order('data_corte', { ascending: true });

      if (usoError) throw usoError;

      // Buscar substituições
      const { data: substituicoes, error: substError } = await this.supabase
        .from('serra_substituicoes')
        .select('*')
        .or(`serra_anterior_id.eq.${serraId},serra_nova_id.eq.${serraId}`)
        .order('data_substituicao', { ascending: false });

      if (substError) throw substError;

      // Calcular estatísticas básicas
      const totalPecasCortadas = usoDetalhado?.reduce((total, uso) => total + uso.quantidade_cortada, 0) || 0;
      const projetosUnicos = new Set(usoDetalhado?.map(uso => uso.projeto_id) || []);
      const projetosUtilizados = projetosUnicos.size;

      const datasUso = usoDetalhado?.map(uso => uso.data_corte).sort() || [];
      const primeiroUso = datasUso[0];
      const ultimoUso = datasUso[datasUso.length - 1];

      // Agrupar dados por projeto
      const projetosMap = new Map();
      usoDetalhado?.forEach(uso => {
        const projetoId = uso.projeto_id;
        if (!projetosMap.has(projetoId)) {
          projetosMap.set(projetoId, {
            projeto_id: projetoId,
            projeto_nome: uso.projetos?.nome || 'Projeto sem nome',
            listas_otimizacao: new Map(),
            total_pecas_projeto: 0,
            data_primeiro_uso: uso.data_corte,
            data_ultimo_uso: uso.data_corte
          });
        }

        const projeto = projetosMap.get(projetoId);
        projeto.total_pecas_projeto += uso.quantidade_cortada;
        
        if (uso.data_corte < projeto.data_primeiro_uso) {
          projeto.data_primeiro_uso = uso.data_corte;
        }
        if (uso.data_corte > projeto.data_ultimo_uso) {
          projeto.data_ultimo_uso = uso.data_corte;
        }

        // Agrupar por lista de otimização
        if (uso.otimizacao_id) {
          const listaId = uso.otimizacao_id;
          if (!projeto.listas_otimizacao.has(listaId)) {
            projeto.listas_otimizacao.set(listaId, {
              otimizacao_id: listaId,
              nome_lista: uso.projeto_otimizacoes?.nome_lista || 'Lista sem nome',
              quantidade_cortada: 0,
              data_corte: uso.data_corte
            });
          }
          projeto.listas_otimizacao.get(listaId).quantidade_cortada += uso.quantidade_cortada;
        }
      });

      // Converter Maps para arrays
      const projetosDetalhados = Array.from(projetosMap.values()).map(projeto => ({
        ...projeto,
        listas_otimizacao: Array.from(projeto.listas_otimizacao.values())
      }));

      // Calcular métricas de tempo
      const datasCriacaoAtualizacao = [serra.created_at, serra.data_instalacao].sort();
      const dataCriacao = datasCriacaoAtualizacao[0];
      
      const primeiraAtivacao = historicoStatus?.find(h => h.status_novo === 'ativada')?.data_mudanca;
      const ultimaAtivacao = historicoStatus?.filter(h => h.status_novo === 'ativada').pop()?.data_mudanca;
      const ultimaDesativacao = historicoStatus?.filter(h => h.status_novo === 'desativada').pop()?.data_mudanca;
      const dataDescarte = historicoStatus?.find(h => h.status_novo === 'descartada')?.data_mudanca;

      // Calcular tempo ativo/inativo (em dias)
      let tempoTotalAtivoDias = 0;
      let tempoTotalInativoDias = 0;
      
      if (historicoStatus && historicoStatus.length > 0) {
        let statusAtual = historicoStatus[0].status_novo;
        let dataInicioStatus = new Date(historicoStatus[0].data_mudanca);
        
        for (let i = 1; i < historicoStatus.length; i++) {
          const dataFimStatus = new Date(historicoStatus[i].data_mudanca);
          const diasNoStatus = Math.ceil((dataFimStatus.getTime() - dataInicioStatus.getTime()) / (1000 * 60 * 60 * 24));
          
          if (statusAtual === 'ativada') {
            tempoTotalAtivoDias += diasNoStatus;
          } else {
            tempoTotalInativoDias += diasNoStatus;
          }
          
          statusAtual = historicoStatus[i].status_novo;
          dataInicioStatus = dataFimStatus;
        }
        
        // Adicionar tempo desde a última mudança até hoje (se não foi descartada)
        if (statusAtual !== 'descartada') {
          const agora = new Date();
          const diasDesdeUltimaMudanca = Math.ceil((agora.getTime() - dataInicioStatus.getTime()) / (1000 * 60 * 60 * 24));
          
          if (statusAtual === 'ativada') {
            tempoTotalAtivoDias += diasDesdeUltimaMudanca;
          } else {
            tempoTotalInativoDias += diasDesdeUltimaMudanca;
          }
        }
      }

      const estatisticas: SerraEstatisticas = {
        serra: serra as Serra,
        total_pecas_cortadas: totalPecasCortadas,
        projetos_utilizados: projetosUtilizados,
        primeiro_uso: primeiroUso,
        ultimo_uso: ultimoUso,
        substituicoes: substituicoes || [],
        historico_status: historicoStatus || [],
        projetos_detalhados: projetosDetalhados,
        metricas_tempo: {
          data_criacao: dataCriacao,
          data_primeira_ativacao: primeiraAtivacao,
          data_ultima_ativacao: ultimaAtivacao,
          data_ultima_desativacao: ultimaDesativacao,
          data_descarte: dataDescarte,
          tempo_total_ativo_dias: tempoTotalAtivoDias > 0 ? tempoTotalAtivoDias : undefined,
          tempo_total_inativo_dias: tempoTotalInativoDias > 0 ? tempoTotalInativoDias : undefined
        }
      };

      return {
        data: estatisticas,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao buscar estatísticas da serra');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async ativar(serraId: string, operadorId?: string, motivo?: string): Promise<ServiceResponse<Serra>> {
    try {
      // Verificar se a serra existe e pode ser ativada
      const { data: serra, error: serraError } = await this.supabase
        .from('serras')
        .select('*')
        .eq('id', serraId)
        .single();

      if (serraError) throw serraError;

      if (serra.status === 'descartada') {
        throw new Error('Serras descartadas não podem ser ativadas');
      }

      if (serra.status === 'ativada') {
        throw new Error('Serra já está ativada');
      }

      // Desativar todas as outras serras primeiro
      const { error: desativarError } = await this.supabase
        .from('serras')
        .update({ status: 'desativada' })
        .eq('status', 'ativada');

      if (desativarError) throw desativarError;

      // Ativar a serra selecionada
      const { data: serraAtivada, error: ativarError } = await this.supabase
        .from('serras')
        .update({ status: 'ativada' })
        .eq('id', serraId)
        .select()
        .single();

      if (ativarError) throw ativarError;

      // Registrar manualmente no histórico se operador e motivo foram fornecidos
      if (operadorId && motivo) {
        await this.supabase
          .from('serra_status_historico')
          .insert([{
            serra_id: serraId,
            status_anterior: serra.status,
            status_novo: 'ativada',
            motivo,
            operador_id: operadorId
          }]);
      }

      ErrorHandler.handleSuccess('Serra ativada com sucesso. Outras serras foram automaticamente desativadas.');

      return {
        data: serraAtivada as Serra,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao ativar serra');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async desativar(serraId: string, operadorId?: string, motivo?: string): Promise<ServiceResponse<Serra>> {
    try {
      // Buscar dados atuais da serra
      const { data: serra, error: serraError } = await this.supabase
        .from('serras')
        .select('*')
        .eq('id', serraId)
        .single();

      if (serraError) throw serraError;

      const { data: serraDesativada, error } = await this.supabase
        .from('serras')
        .update({ status: 'desativada' })
        .eq('id', serraId)
        .select()
        .single();

      if (error) throw error;

      // Registrar manualmente no histórico se operador e motivo foram fornecidos
      if (operadorId && motivo) {
        await this.supabase
          .from('serra_status_historico')
          .insert([{
            serra_id: serraId,
            status_anterior: serra.status,
            status_novo: 'desativada',
            motivo,
            operador_id: operadorId
          }]);
      }

      ErrorHandler.handleSuccess('Serra desativada com sucesso');

      return {
        data: serraDesativada as Serra,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao desativar serra');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async descartar(serraId: string, motivo: string, operadorId?: string): Promise<ServiceResponse<Serra>> {
    try {
      // Verificar se a serra existe
      const { data: serra, error: serraError } = await this.supabase
        .from('serras')
        .select('*')
        .eq('id', serraId)
        .single();

      if (serraError) throw serraError;

      if (serra.status === 'descartada') {
        throw new Error('Serra já está descartada');
      }

      // Registrar substituição como descarte
      const { error: substError } = await this.supabase
        .from('serra_substituicoes')
        .insert([{
          serra_anterior_id: serraId,
          serra_nova_id: serraId, // Mesmo ID para indicar descarte
          motivo,
          operador_id: operadorId
        }]);

      if (substError) throw substError;

      // Descartar serra
      const { data: serraDescartada, error: updateError } = await this.supabase
        .from('serras')
        .update({ status: 'descartada' })
        .eq('id', serraId)
        .select()
        .single();

      if (updateError) throw updateError;

      ErrorHandler.handleSuccess('Serra descartada com sucesso');

      return {
        data: serraDescartada as Serra,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao descartar serra');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }
}

export const serraService = new SerraService();