import { BaseService } from '../base/BaseService';
import { ErrorHandler } from '../base/ErrorHandler';
import type { Serra, SerraEstatisticas } from '../interfaces/serra';
import type { ServiceResponse, ListResponse, CreateRequest, UpdateRequest } from '../base/types';

export class SerraService extends BaseService<Serra> {
  protected tableName = 'serras';
  
  constructor() {
    super('serras');
  }

  async getAtivas(): Promise<ListResponse<Serra>> {
    try {
      const { data, error } = await this.supabase
        .from('serras')
        .select('*')
        .eq('status', 'ativa')
        .order('codigo');

      if (error) throw error;

      return {
        data: (data as Serra[]) || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao buscar serras ativas');
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

  async substituir(serraAnteriorId: string, novaSerraData: Omit<Serra, 'id' | 'created_at' | 'updated_at'>, motivo: string, operadorId?: string): Promise<ServiceResponse<{ serra: Serra; substituicao: any }>> {
    try {
      // Criar nova serra
      const { data: novaSerra, error: novaSerraError } = await this.supabase
        .from('serras')
        .insert([novaSerraData])
        .select()
        .single();

      if (novaSerraError) throw novaSerraError;

      // Marcar serra anterior como substituída
      const { error: updateError } = await this.supabase
        .from('serras')
        .update({ status: 'substituida' })
        .eq('id', serraAnteriorId);

      if (updateError) throw updateError;

      // Registrar substituição
      const { data: substituicao, error: substError } = await this.supabase
        .from('serra_substituicoes')
        .insert([{
          serra_anterior_id: serraAnteriorId,
          serra_nova_id: novaSerra.id,
          motivo,
          operador_id: operadorId
        }])
        .select()
        .single();

      if (substError) throw substError;

      ErrorHandler.handleSuccess('Serra substituída com sucesso');

      return {
        data: { serra: novaSerra as Serra, substituicao },
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao substituir serra');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }
}

export const serraService = new SerraService();