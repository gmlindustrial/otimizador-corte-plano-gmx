
import { useState } from 'react';
import { materialService } from '@/services';
import type { Material } from '@/services/interfaces';

export const useMaterialByTypeService = () => {
  const [loading, setLoading] = useState(false);
  const [materiaisBarras, setMateriaisBarras] = useState<Material[]>([]);
  const [materiaisChapas, setMateriaisChapas] = useState<Material[]>([]);

  const fetchMateriaisBarras = async () => {
    setLoading(true);
    const response = await materialService.getByTipoCorte('barra');
    if (response.success) {
      setMateriaisBarras(response.data);
    }
    setLoading(false);
    return response;
  };

  const fetchMateriaisChapas = async () => {
    setLoading(true);
    const response = await materialService.getByTipoCorte('chapa');
    if (response.success) {
      setMateriaisChapas(response.data);
    }
    setLoading(false);
    return response;
  };

  const createMaterial = async (materialData: Omit<Material, 'id' | 'created_at'>) => {
    setLoading(true);
    const response = await materialService.create({ data: materialData });
    if (response.success && response.data) {
      // Atualizar a lista correspondente baseado no tipo_corte
      if (materialData.tipo_corte === 'chapa') {
        setMateriaisChapas(prev => [response.data!, ...prev]);
      } else {
        setMateriaisBarras(prev => [response.data!, ...prev]);
      }
    }
    setLoading(false);
    return response;
  };

  return {
    materiaisBarras,
    materiaisChapas,
    loading,
    fetchMateriaisBarras,
    fetchMateriaisChapas,
    createMaterial
  };
};
