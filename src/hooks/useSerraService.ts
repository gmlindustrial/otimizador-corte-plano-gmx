import { useState, useEffect, useCallback } from 'react';
import { serraService } from '@/services/entities/SerraService';
import { serraUsoCorteService } from '@/services/entities/SerraUsoCorteService';
import type { Serra, SerraEstatisticas, SerraUsoCorte } from '@/services/interfaces/serra';

export const useSerraService = () => {
  const [serras, setSerras] = useState<Serra[]>([]);
  const [serrasAtivadas, setSerrasAtivadas] = useState<Serra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSerras = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraService.getAll();
      if (response.success) {
        setSerras(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Erro ao carregar serras');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSerrasAtivadas = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraService.getAtivadas();
      if (response.success) {
        setSerrasAtivadas(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Erro ao carregar serras ativadas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSerra = useCallback(async (serra: Omit<Serra, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraService.create({ data: serra });
      if (response.success) {
        await fetchSerras();
        await fetchSerrasAtivadas();
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      const error = 'Erro ao criar serra';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [fetchSerras, fetchSerrasAtivadas]);

  const updateSerra = useCallback(async (id: string, serra: Partial<Serra>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraService.update({ id, data: serra });
      if (response.success) {
        await fetchSerras();
        await fetchSerrasAtivadas();
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      const error = 'Erro ao atualizar serra';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [fetchSerras, fetchSerrasAtivadas]);

  const ativarSerra = useCallback(async (serraId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraService.ativar(serraId);
      if (response.success) {
        await fetchSerras();
        await fetchSerrasAtivadas();
        return response;
      } else {
        setError(response.error);
        return response;
      }
    } catch (err) {
      const error = 'Erro ao ativar serra';
      setError(error);
      return { success: false, error, data: null };
    } finally {
      setLoading(false);
    }
  }, [fetchSerras, fetchSerrasAtivadas]);

  const desativarSerra = useCallback(async (serraId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraService.desativar(serraId);
      if (response.success) {
        await fetchSerras();
        await fetchSerrasAtivadas();
        return response;
      } else {
        setError(response.error);
        return response;
      }
    } catch (err) {
      const error = 'Erro ao desativar serra';
      setError(error);
      return { success: false, error, data: null };
    } finally {
      setLoading(false);
    }
  }, [fetchSerras, fetchSerrasAtivadas]);

  const descartarSerra = useCallback(async (serraId: string, motivo: string, operadorId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraService.descartar(serraId, motivo, operadorId);
      if (response.success) {
        await fetchSerras();
        await fetchSerrasAtivadas();
        return response;
      } else {
        setError(response.error);
        return response;
      }
    } catch (err) {
      const error = 'Erro ao descartar serra';
      setError(error);
      return { success: false, error, data: null };
    } finally {
      setLoading(false);
    }
  }, [fetchSerras, fetchSerrasAtivadas]);

  const registrarCorteCompleto = useCallback(async (data: {
    serra_id: string;
    projeto_id: string;
    otimizacao_id?: string;
    peca_id?: string;
    quantidade_cortada: number;
    operador_id?: string;
    observacoes?: string;
    peca_posicao?: string;
    peca_tag?: string;
    perfil_id?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraUsoCorteService.registrarCorteCompleto(data);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError('Erro ao registrar corte completo');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstatisticas = useCallback(async (serraId: string): Promise<SerraEstatisticas | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraService.getEstatisticas(serraId);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError('Erro ao carregar estatísticas da serra');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarCorte = useCallback(async (data: Omit<SerraUsoCorte, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraUsoCorteService.registrarCorte(data);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError('Erro ao registrar corte');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSerras();
    fetchSerrasAtivadas();
  }, [fetchSerras, fetchSerrasAtivadas]);

  return {
    serras,
    serrasAtivadas,
    loading,
    error,
    createSerra,
    updateSerra,
    ativarSerra,
    desativarSerra,
    descartarSerra,
    getEstatisticas,
    registrarCorte,
    registrarCorteCompleto,
    refetch: fetchSerras,
    refetchAtivadas: fetchSerrasAtivadas
  };
};