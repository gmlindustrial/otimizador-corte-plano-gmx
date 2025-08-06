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

      // Buscar estatísticas de uso
      const { data: usoData, error: usoError } = await this.supabase
        .from('serra_uso_cortes')
        .select('quantidade_cortada, data_corte, projeto_id')
        .eq('serra_id', serraId);

      if (usoError) throw usoError;

      // Buscar substituições
      const { data: substituicoes, error: substError } = await this.supabase
        .from('serra_substituicoes')
        .select('*')
        .or(`serra_anterior_id.eq.${serraId},serra_nova_id.eq.${serraId}`)
        .order('data_substituicao', { ascending: false });

      if (substError) throw substError;

      // Calcular estatísticas
      const totalPecasCortadas = usoData?.reduce((total, uso) => total + uso.quantidade_cortada, 0) || 0;
      const projetosUnicos = new Set(usoData?.map(uso => uso.projeto_id) || []);
      const projetosUtilizados = projetosUnicos.size;

      const datasUso = usoData?.map(uso => uso.data_corte).sort() || [];
      const primeiroUso = datasUso[0];
      const ultimoUso = datasUso[datasUso.length - 1];

      const estatisticas: SerraEstatisticas = {
        serra: serra as Serra,
        total_pecas_cortadas: totalPecasCortadas,
        projetos_utilizados: projetosUtilizados,
        primeiro_uso: primeiroUso,
        ultimo_uso: ultimoUso,
        substituicoes: substituicoes || []
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

  async ativar(serraId: string): Promise<ServiceResponse<Serra>> {
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

  async desativar(serraId: string): Promise<ServiceResponse<Serra>> {
    try {
      const { data: serraDesativada, error } = await this.supabase
        .from('serras')
        .update({ status: 'desativada' })
        .eq('id', serraId)
        .select()
        .single();

      if (error) throw error;

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