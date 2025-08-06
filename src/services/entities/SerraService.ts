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
      // Buscar serra anterior para verificar status
      const { data: serraAnterior, error: serraError } = await this.supabase
        .from('serras')
        .select('*')
        .eq('id', serraAnteriorId)
        .single();

      if (serraError) throw serraError;

      // Criar nova serra
      const { data: novaSerra, error: novaSerraError } = await this.supabase
        .from('serras')
        .insert([novaSerraData])
        .select()
        .single();

      if (novaSerraError) throw novaSerraError;

      // Determinar novo status da serra anterior baseado no motivo
      let novoStatus: Serra['status'] = 'substituida';
      if (motivo.toLowerCase().includes('cega')) {
        novoStatus = 'cega';
      } else if (motivo.toLowerCase().includes('quebrada') || motivo.toLowerCase().includes('quebrou')) {
        novoStatus = 'quebrada';
      }

      // Marcar serra anterior com status apropriado
      const { error: updateError } = await this.supabase
        .from('serras')
        .update({ status: novoStatus })
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

      ErrorHandler.handleSuccess(`Serra substituída com sucesso. Status da serra anterior: ${novoStatus}`);

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

  async reativar(serraId: string): Promise<ServiceResponse<Serra>> {
    try {
      // Buscar serra para verificar se pode ser reativada
      const { data: serra, error: serraError } = await this.supabase
        .from('serras')
        .select('*')
        .eq('id', serraId)
        .single();

      if (serraError) throw serraError;

      // Verificar se a serra pode ser reativada
      if (serra.status === 'cega' || serra.status === 'quebrada') {
        throw new Error(`Serra não pode ser reativada. Status: ${serra.status}. Serras cegas ou quebradas não podem ser reutilizadas.`);
      }

      if (serra.status === 'ativa') {
        throw new Error('Serra já está ativa');
      }

      // Reativar serra
      const { data: serraAtualizada, error: updateError } = await this.supabase
        .from('serras')
        .update({ status: 'ativa' })
        .eq('id', serraId)
        .select()
        .single();

      if (updateError) throw updateError;

      ErrorHandler.handleSuccess('Serra reativada com sucesso');

      return {
        data: serraAtualizada as Serra,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, 'Erro ao reativar serra');
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }
}

export const serraService = new SerraService();