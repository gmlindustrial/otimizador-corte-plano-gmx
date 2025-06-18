
import { useState } from 'react';
import { obraService } from '@/services';
import type { Obra } from '@/services/interfaces';

export const useObraService = () => {
  const [loading, setLoading] = useState(false);
  const [obras, setObras] = useState<Obra[]>([]);

  const fetchObras = async () => {
    setLoading(true);
    const response = await obraService.getAll();
    if (response.success) {
      setObras(response.data);
    }
    setLoading(false);
    return response;
  };

  const createObra = async (obraData: Omit<Obra, 'id' | 'created_at'>) => {
    setLoading(true);
    const response = await obraService.create({ data: obraData });
    if (response.success && response.data) {
      setObras(prev => [response.data!, ...prev]);
    }
    setLoading(false);
    return response;
  };

  const updateObra = async (id: string, obraData: Partial<Omit<Obra, 'id' | 'created_at'>>) => {
    setLoading(true);
    const response = await obraService.update({ id, data: obraData });
    if (response.success && response.data) {
      setObras(prev => prev.map(obra => obra.id === id ? response.data! : obra));
    }
    setLoading(false);
    return response;
  };

  const deleteObra = async (id: string) => {
    setLoading(true);
    const response = await obraService.delete({ id });
    if (response.success) {
      setObras(prev => prev.filter(obra => obra.id !== id));
    }
    setLoading(false);
    return response;
  };

  return {
    obras,
    loading,
    fetchObras,
    createObra,
    updateObra,
    deleteObra
  };
};
