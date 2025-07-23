import { useCallback } from 'react';
import { auditService } from '@/services/AuditService';

export const useAuditLogger = () => {
  const logProjectAction = useCallback(async (
    action: string,
    projectId: string,
    projectName: string,
    details?: any
  ) => {
    try {
      await auditService.logProjectAction(action, projectId, projectName, details);
    } catch (error) {
      console.error('Erro ao registrar log de projeto:', error);
    }
  }, []);

  const logPieceAction = useCallback(async (
    action: string,
    pieceId: string,
    projectName: string,
    details?: any
  ) => {
    try {
      await auditService.logPieceAction(action, pieceId, projectName, details);
    } catch (error) {
      console.error('Erro ao registrar log de peça:', error);
    }
  }, []);

  const logOptimizationAction = useCallback(async (
    action: string,
    optimizationId: string,
    projectName: string,
    details?: any
  ) => {
    try {
      await auditService.logOptimizationAction(action, optimizationId, projectName, details);
    } catch (error) {
      console.error('Erro ao registrar log de otimização:', error);
    }
  }, []);

  const logUserAction = useCallback(async (
    action: string,
    targetUserId: string,
    targetUserName: string,
    details?: any
  ) => {
    try {
      await auditService.logUserAction(action, targetUserId, targetUserName, details);
    } catch (error) {
      console.error('Erro ao registrar log de usuário:', error);
    }
  }, []);

  const logSystemActivity = useCallback(async (action: {
    actionType: string;
    entityType: string;
    entityId?: string;
    description: string;
    details?: any;
  }) => {
    try {
      await auditService.logSystemActivity(action);
    } catch (error) {
      console.error('Erro ao registrar atividade do sistema:', error);
    }
  }, []);

  return {
    logProjectAction,
    logPieceAction,
    logOptimizationAction,
    logUserAction,
    logSystemActivity
  };
};