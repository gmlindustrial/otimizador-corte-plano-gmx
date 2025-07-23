import { supabase } from '@/integrations/supabase/client';
import { MonitoringService, EnhancedErrorHandler } from './MonitoringService';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action_type: string;
  user_id?: string;
  user_name?: string;
  timestamp: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  context?: string;
  created_at?: string;
}

export interface SystemActivityLog {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  user_id?: string;
  user_name?: string;
  description: string;
  details?: any;
  timestamp: string;
  ip_address?: string;
  session_id?: string;
}

export interface AuditFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  actionType?: string;
  entityType?: string;
  tableName?: string;
  limit?: number;
  offset?: number;
}

export class AuditService {
  private static instance: AuditService;
  private monitoring = MonitoringService.getInstance();

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Registra uma ação no sistema de auditoria
   */
  async logSystemActivity(action: {
    actionType: string;
    entityType: string;
    entityId?: string;
    description: string;
    details?: any;
    context?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      // Buscar informações do usuário na tabela usuarios
      let userName = 'Sistema';
      if (user?.id) {
        const { data: userInfo } = await supabase
          .from('usuarios')
          .select('nome')
          .eq('id', user.id)
          .single();
        
        userName = userInfo?.nome || user.email || 'Usuário Desconhecido';
      }

      const logEntry = {
        action_type: action.actionType,
        entity_type: action.entityType,
        entity_id: action.entityId,
        user_id: user?.id,
        user_name: userName,
        description: action.description,
        details: action.details,
        timestamp: new Date().toISOString(),
        session_id: this.generateSessionId()
      };

      const { error } = await supabase
        .from('system_activity_logs')
        .insert(logEntry);

      if (error) throw error;

      this.monitoring.info(`Sistema: ${action.description}`, action.entityType, {
        actionType: action.actionType,
        entityId: action.entityId,
        user: userName
      });

      return { success: true };
    } catch (error) {
      const errorMessage = EnhancedErrorHandler.handle(error, 'AuditService.logSystemActivity');
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Busca logs de auditoria com filtros
   */
  async getAuditLogs(filters: AuditFilters = {}): Promise<{
    data: AuditLog[];
    total: number;
    success: boolean;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false });

      // Aplicar filtros
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters.tableName) {
        query = query.eq('table_name', filters.tableName);
      }

      // Paginação
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        success: true
      };
    } catch (error) {
      const errorMessage = EnhancedErrorHandler.handle(error, 'AuditService.getAuditLogs');
      return {
        data: [],
        total: 0,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Busca logs de atividade do sistema com filtros
   */
  async getSystemActivityLogs(filters: AuditFilters = {}): Promise<{
    data: SystemActivityLog[];
    total: number;
    success: boolean;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('system_activity_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false });

      // Aplicar filtros
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      // Paginação
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        success: true
      };
    } catch (error) {
      const errorMessage = EnhancedErrorHandler.handle(error, 'AuditService.getSystemActivityLogs');
      return {
        data: [],
        total: 0,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Busca estatísticas de auditoria
   */
  async getAuditStats(filters: AuditFilters = {}): Promise<{
    data: {
      totalActions: number;
      actionsByType: Record<string, number>;
      actionsByUser: Record<string, number>;
      actionsByEntity: Record<string, number>;
      recentActivity: number;
    };
    success: boolean;
    error?: string;
  }> {
    try {
      // Buscar dados dos últimos 30 dias se não especificado
      const endDate = filters.endDate || new Date();
      const startDate = filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const { data: activityLogs, error } = await supabase
        .from('system_activity_logs')
        .select('action_type, entity_type, user_name, timestamp')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error) throw error;

      const stats = {
        totalActions: activityLogs?.length || 0,
        actionsByType: {} as Record<string, number>,
        actionsByUser: {} as Record<string, number>,
        actionsByEntity: {} as Record<string, number>,
        recentActivity: 0
      };

      // Calcular atividade recente (últimas 24 horas)
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      activityLogs?.forEach(log => {
        // Contar por tipo de ação
        stats.actionsByType[log.action_type] = (stats.actionsByType[log.action_type] || 0) + 1;
        
        // Contar por usuário
        const userName = log.user_name || 'Sistema';
        stats.actionsByUser[userName] = (stats.actionsByUser[userName] || 0) + 1;
        
        // Contar por entidade
        stats.actionsByEntity[log.entity_type] = (stats.actionsByEntity[log.entity_type] || 0) + 1;
        
        // Atividade recente
        if (new Date(log.timestamp) > last24Hours) {
          stats.recentActivity++;
        }
      });

      return {
        data: stats,
        success: true
      };
    } catch (error) {
      const errorMessage = EnhancedErrorHandler.handle(error, 'AuditService.getAuditStats');
      return {
        data: {
          totalActions: 0,
          actionsByType: {},
          actionsByUser: {},
          actionsByEntity: {},
          recentActivity: 0
        },
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Exporta logs de auditoria em formato JSON
   */
  async exportAuditLogs(filters: AuditFilters = {}): Promise<{
    data?: string;
    success: boolean;
    error?: string;
  }> {
    try {
      const { data: auditLogs } = await this.getAuditLogs(filters);
      const { data: activityLogs } = await this.getSystemActivityLogs(filters);

      const exportData = {
        exportDate: new Date().toISOString(),
        filters,
        auditLogs,
        activityLogs,
        summary: {
          totalAuditLogs: auditLogs.length,
          totalActivityLogs: activityLogs.length
        }
      };

      return {
        data: JSON.stringify(exportData, null, 2),
        success: true
      };
    } catch (error) {
      const errorMessage = EnhancedErrorHandler.handle(error, 'AuditService.exportAuditLogs');
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Métodos de conveniência para logging específico de entidades

  async logProjectAction(action: string, projectId: string, projectName: string, details?: any) {
    return this.logSystemActivity({
      actionType: action,
      entityType: 'PROJETO',
      entityId: projectId,
      description: `${action} projeto: ${projectName}`,
      details
    });
  }

  async logPieceAction(action: string, pieceId: string, projectName: string, details?: any) {
    const descricao = details?.descricaoCustomizada || `${action} peça no projeto: ${projectName}`;
    
    return this.logSystemActivity({
      actionType: action,
      entityType: 'PECA',
      entityId: pieceId,
      description: descricao,
      details
    });
  }

  async logOptimizationAction(action: string, optimizationId: string, projectName: string, details?: any) {
    return this.logSystemActivity({
      actionType: action,
      entityType: 'OTIMIZACAO',
      entityId: optimizationId,
      description: `${action} otimização no projeto: ${projectName}`,
      details
    });
  }

  async logUserAction(action: string, targetUserId: string, targetUserName: string, details?: any) {
    return this.logSystemActivity({
      actionType: action,
      entityType: 'USUARIO',
      entityId: targetUserId,
      description: `${action} usuário: ${targetUserName}`,
      details
    });
  }

  /**
   * Busca histórico específico de um projeto
   */
  async getProjectHistory(projectId: string, filters: AuditFilters = {}): Promise<{
    data: SystemActivityLog[];
    total: number;
    success: boolean;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('system_activity_logs')
        .select('*', { count: 'exact' })
        .or(`entity_id.eq.${projectId},description.ilike.%${projectId}%`)
        .order('timestamp', { ascending: false });

      // Aplicar filtros adicionais
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      // Paginação
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        success: true
      };
    } catch (error) {
      const errorMessage = EnhancedErrorHandler.handle(error, 'AuditService.getProjectHistory');
      return {
        data: [],
        total: 0,
        success: false,
        error: errorMessage
      };
    }
  }
}

export const auditService = AuditService.getInstance();