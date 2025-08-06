import { useState, useEffect, useCallback } from 'react';
import { serraService } from '@/services/entities/SerraService';
import { serraUsoCorteService } from '@/services/entities/SerraUsoCorteService';
import type { Serra, SerraEstatisticas, SerraUsoCorte } from '@/services/interfaces/serra';

export const useSerraService = () => {
  const [serras, setSerras] = useState<Serra[]>([]);
  const [serrasAtivas, setSerrasAtivas] = useState<Serra[]>([]);
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

  const fetchSerrasAtivas = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraService.getAtivas();
      if (response.success) {
        setSerrasAtivas(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Erro ao carregar serras ativas');
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
        await fetchSerrasAtivas();
        return response.data;
      } else {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError('Erro ao criar serra');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSerras, fetchSerrasAtivas]);

  const updateSerra = useCallback(async (id: string, serra: Partial<Serra>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraService.update({ id, data: serra });
      if (response.success) {
        await fetchSerras();
        await fetchSerrasAtivas();
        return response.data;
      } else {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError('Erro ao atualizar serra');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSerras, fetchSerrasAtivas]);

  const substituirSerra = useCallback(async (
    serraAnteriorId: string, 
    novaSerraData: Omit<Serra, 'id' | 'created_at' | 'updated_at'>, 
    motivo: string, 
    operadorId?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraService.substituir(serraAnteriorId, novaSerraData, motivo, operadorId);
      if (response.success) {
        await fetchSerras();
        await fetchSerrasAtivas();
        return response.data;
      } else {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError('Erro ao substituir serra');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSerras, fetchSerrasAtivas]);

  const reativarSerra = useCallback(async (serraId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serraService.reativar(serraId);
      if (response.success) {
        await fetchSerras();
        await fetchSerrasAtivas();
        return response.data;
      } else {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError('Erro ao reativar serra');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSerras, fetchSerrasAtivas]);

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
    fetchSerrasAtivas();
  }, [fetchSerras, fetchSerrasAtivas]);

  return {
    serras,
    serrasAtivas,
    loading,
    error,
    createSerra,
    updateSerra,
    substituirSerra,
    reativarSerra,
    getEstatisticas,
    registrarCorte,
    registrarCorteCompleto,
    refetch: fetchSerras,
    refetchAtivas: fetchSerrasAtivas
  };
};