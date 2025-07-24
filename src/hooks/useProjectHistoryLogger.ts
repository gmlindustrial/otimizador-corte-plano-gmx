import { useCallback } from 'react';
import { projectHistoryService } from '@/services/entities/ProjectHistoryService';
import { useAuthGuard } from './useAuthGuard';

export const useProjectHistoryLogger = () => {
  const { user } = useAuthGuard();

  const logPecaCortada = useCallback(async (
    projectId: string,
    pecaTag: string,
    optimizationName: string,
    details?: Record<string, any>
  ) => {
    if (!user?.nome) return;
    
    try {
      await projectHistoryService.logPecaCortada(
        projectId,
        pecaTag,
        optimizationName,
        user.nome,
        details
      );
    } catch (error) {
      console.error('Erro ao registrar peça cortada:', error);
    }
  }, [user?.nome]);

  const logPecaDeletada = useCallback(async (
    projectId: string,
    pecaTag: string,
    details?: Record<string, any>
  ) => {
    if (!user?.nome) return;
    
    try {
      await projectHistoryService.logPecaDeletada(
        projectId,
        pecaTag,
        user.nome,
        details
      );
    } catch (error) {
      console.error('Erro ao registrar peça deletada:', error);
    }
  }, [user?.nome]);

  const logOtimizacaoCriada = useCallback(async (
    projectId: string,
    optimizationName: string,
    details?: Record<string, any>
  ) => {
    if (!user?.nome) return;
    
    try {
      await projectHistoryService.logOtimizacaoCriada(
        projectId,
        optimizationName,
        user.nome,
        details
      );
    } catch (error) {
      console.error('Erro ao registrar otimização criada:', error);
    }
  }, [user?.nome]);

  const logOtimizacaoDeletada = useCallback(async (
    projectId: string,
    optimizationName: string,
    details?: Record<string, any>
  ) => {
    if (!user?.nome) return;
    
    try {
      await projectHistoryService.logOtimizacaoDeletada(
        projectId,
        optimizationName,
        user.nome,
        details
      );
    } catch (error) {
      console.error('Erro ao registrar otimização deletada:', error);
    }
  }, [user?.nome]);

  return {
    logPecaCortada,
    logPecaDeletada,
    logOtimizacaoCriada,
    logOtimizacaoDeletada
  };
};