import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectHistoryEntry {
  id: string;
  project_id: string;
  action_type: 'PECA_CORTADA' | 'PECA_DELETADA' | 'OTIMIZACAO_CRIADA' | 'OTIMIZACAO_DELETADA';
  entity_type: 'PECA' | 'OTIMIZACAO';
  entity_id: string;
  user_id?: string;
  user_name: string;
  description: string;
  details: Record<string, any>;
  timestamp: string;
  created_at: string;
}

export interface ProjectHistoryFilters {
  action_type?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class ProjectHistoryService extends BaseService<ProjectHistoryEntry> {
  constructor() {
    super('project_history');
  }

  async logPecaCortada(
    projectId: string, 
    pecaTag: string, 
    optimizationName: string, 
    userName: string,
    details: Record<string, any> = {}
  ) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const entry = {
        project_id: projectId,
        action_type: 'PECA_CORTADA' as const,
        entity_type: 'PECA' as const,
        entity_id: pecaTag,
        user_id: user.user?.id,
        user_name: userName,
        description: `Peça ${pecaTag} marcada como cortada na lista ${optimizationName}`,
        details: {
          tag: pecaTag,
          optimization_name: optimizationName,
          ...details
        }
      };

      const { data, error } = await supabase
        .from('project_history')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro ao registrar peça cortada:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async logPecaDeletada(
    projectId: string, 
    pecaTag: string, 
    userName: string,
    details: Record<string, any> = {}
  ) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const entry = {
        project_id: projectId,
        action_type: 'PECA_DELETADA' as const,
        entity_type: 'PECA' as const,
        entity_id: pecaTag,
        user_id: user.user?.id,
        user_name: userName,
        description: `Peça ${pecaTag} removida do projeto`,
        details: {
          tag: pecaTag,
          ...details
        }
      };

      const { data, error } = await supabase
        .from('project_history')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro ao registrar peça deletada:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async logOtimizacaoCriada(
    projectId: string, 
    optimizationName: string, 
    userName: string,
    details: Record<string, any> = {}
  ) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const entry = {
        project_id: projectId,
        action_type: 'OTIMIZACAO_CRIADA' as const,
        entity_type: 'OTIMIZACAO' as const,
        entity_id: optimizationName,
        user_id: user.user?.id,
        user_name: userName,
        description: `Otimização ${optimizationName} criada`,
        details: {
          optimization_name: optimizationName,
          ...details
        }
      };

      const { data, error } = await supabase
        .from('project_history')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro ao registrar otimização criada:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async logOtimizacaoDeletada(
    projectId: string, 
    optimizationName: string, 
    userName: string,
    details: Record<string, any> = {}
  ) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const entry = {
        project_id: projectId,
        action_type: 'OTIMIZACAO_DELETADA' as const,
        entity_type: 'OTIMIZACAO' as const,
        entity_id: optimizationName,
        user_id: user.user?.id,
        user_name: userName,
        description: `Otimização ${optimizationName} removida do projeto`,
        details: {
          optimization_name: optimizationName,
          ...details
        }
      };

      const { data, error } = await supabase
        .from('project_history')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro ao registrar otimização deletada:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async getProjectHistory(
    projectId: string, 
    filters: ProjectHistoryFilters = {}
  ) {
    try {
      let query = supabase
        .from('project_history')
        .select('*')
        .eq('project_id', projectId)
        .order('timestamp', { ascending: false });

      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type as any);
      }

      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type as any);
      }

      if (filters.start_date) {
        query = query.gte('timestamp', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('timestamp', filters.end_date);
      }

      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,entity_id.ilike.%${filters.search}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [], error: null };
    } catch (error: any) {
      console.error('Erro ao buscar histórico do projeto:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async exportProjectHistory(projectId: string) {
    try {
      const { data, error } = await this.getProjectHistory(projectId);
      
      if (error || !data) {
        throw new Error('Erro ao buscar histórico para exportação');
      }

      const csvContent = this.convertToCSV(data);
      return { success: true, data: csvContent, error: null };
    } catch (error: any) {
      console.error('Erro ao exportar histórico:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  private convertToCSV(data: ProjectHistoryEntry[]): string {
    const headers = ['Data/Hora', 'Ação', 'Entidade', 'Usuário', 'Descrição'];
    const rows = data.map(entry => [
      new Date(entry.timestamp).toLocaleString('pt-BR'),
      entry.action_type,
      entry.entity_type,
      entry.user_name,
      entry.description
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

export const projectHistoryService = new ProjectHistoryService();