import { useState, useEffect } from 'react';
import { laminaService } from '@/services/entities/LaminaService';
import { laminaUsoCorteService } from '@/services/entities/LaminaUsoCorteService';
import type { Lamina, LaminaEstatisticas, LaminaUsoCorte } from '@/services/interfaces/lamina';

export const useLaminaService = () => {
  const [laminas, setLaminas] = useState<Lamina[]>([]);
  const [laminasAtivadas, setLaminasAtivadas] = useState<Lamina[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLaminas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await laminaService.getAll();
      if (response.success) {
        setLaminas(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Erro ao buscar lâminas');
    } finally {
      setLoading(false);
    }
  };

  const fetchLaminasAtivadas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await laminaService.getAtivadas();
      if (response.success) {
        setLaminasAtivadas(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Erro ao buscar lâminas ativadas');
    } finally {
      setLoading(false);
    }
  };

  const createLamina = async (lamina: Omit<Lamina, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await laminaService.create({ data: lamina });
      if (response.success) {
        await fetchLaminas();
        return response;
      } else {
        setError(response.error);
        return response;
      }
    } catch (err) {
      setError('Erro ao criar lâmina');
      return { success: false, error: 'Erro ao criar lâmina', data: null };
    } finally {
      setLoading(false);
    }
  };

  const updateLamina = async (id: string, lamina: Partial<Omit<Lamina, 'id' | 'created_at'>>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await laminaService.update({ id, data: lamina });
      if (response.success) {
        await fetchLaminas();
        return response;
      } else {
        setError(response.error);
        return response;
      }
    } catch (err) {
      setError('Erro ao atualizar lâmina');
      return { success: false, error: 'Erro ao atualizar lâmina', data: null };
    } finally {
      setLoading(false);
    }
  };

  const ativarLamina = async (laminaId: string, operadorId?: string, motivo?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await laminaService.ativar(laminaId, operadorId, motivo);
      if (response.success) {
        await fetchLaminas();
        await fetchLaminasAtivadas();
        return response;
      } else {
        setError(response.error);
        return response;
      }
    } catch (err) {
      setError('Erro ao ativar lâmina');
      return { success: false, error: 'Erro ao ativar lâmina', data: null };
    } finally {
      setLoading(false);
    }
  };

  const desativarLamina = async (laminaId: string, operadorId?: string, motivo?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await laminaService.desativar(laminaId, operadorId, motivo);
      if (response.success) {
        await fetchLaminas();
        await fetchLaminasAtivadas();
        return response;
      } else {
        setError(response.error);
        return response;
      }
    } catch (err) {
      setError('Erro ao desativar lâmina');
      return { success: false, error: 'Erro ao desativar lâmina', data: null };
    } finally {
      setLoading(false);
    }
  };

  const descartarLamina = async (laminaId: string, motivo: string, operadorId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await laminaService.descartar(laminaId, motivo, operadorId);
      if (response.success) {
        await fetchLaminas();
        await fetchLaminasAtivadas();
        return response;
      } else {
        setError(response.error);
        return response;
      }
    } catch (err) {
      setError('Erro ao descartar lâmina');
      return { success: false, error: 'Erro ao descartar lâmina', data: null };
    } finally {
      setLoading(false);
    }
  };

  const registrarCorteCompleto = async (data: {
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
      const response = await laminaUsoCorteService.registrarCorteCompleto(data);
      if (!response.success) {
        setError(response.error);
      }
      return response;
    } catch (err) {
      setError('Erro ao registrar corte');
      return { success: false, error: 'Erro ao registrar corte', data: null };
    } finally {
      setLoading(false);
    }
  };

  const getEstatisticas = async (laminaId: string): Promise<LaminaEstatisticas | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await laminaService.getEstatisticas(laminaId);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError('Erro ao buscar estatísticas');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const registrarCorte = async (data: Omit<LaminaUsoCorte, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await laminaUsoCorteService.registrarCorte(data);
      if (!response.success) {
        setError(response.error);
      }
      return response;
    } catch (err) {
      setError('Erro ao registrar corte');
      return { success: false, error: 'Erro ao registrar corte', data: null };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaminas();
    fetchLaminasAtivadas();
  }, []);

  return {
    laminas,
    laminasAtivadas,
    loading,
    error,
    fetchLaminas,
    fetchLaminasAtivadas,
    refetch: fetchLaminas,
    refetchAtivadas: fetchLaminasAtivadas,
    createLamina,
    updateLamina,
    ativarLamina,
    desativarLamina,
    descartarLamina,
    registrarCorteCompleto,
    getEstatisticas,
    registrarCorte,
  };
};