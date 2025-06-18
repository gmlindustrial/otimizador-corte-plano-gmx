
import { useState } from 'react';
import { materialService } from '@/services';
import type { Material } from '@/services/interfaces';

export const useMaterialService = () => {
  const [loading, setLoading] = useState(false);
  const [materiais, setMateriais] = useState<Material[]>([]);

  const fetchMateriais = async () => {
    setLoading(true);
    const response = await materialService.getAll();
    if (response.success) {
      setMateriais(response.data);
    }
    setLoading(false);
    return response;
  };

  const createMaterial = async (materialData: Omit<Material, 'id' | 'created_at'>) => {
    setLoading(true);
    const response = await materialService.create({ data: materialData });
    if (response.success && response.data) {
      setMateriais(prev => [response.data!, ...prev]);
    }
    setLoading(false);
    return response;
  };

  const updateMaterial = async (id: string, materialData: Partial<Omit<Material, 'id' | 'created_at'>>) => {
    setLoading(true);
    const response = await materialService.update({ id, data: materialData });
    if (response.success && response.data) {
      setMateriais(prev => prev.map(material => material.id === id ? response.data! : material));
    }
    setLoading(false);
    return response;
  };

  const deleteMaterial = async (id: string) => {
    setLoading(true);
    const response = await materialService.delete({ id });
    if (response.success) {
      setMateriais(prev => prev.filter(material => material.id !== id));
    }
    setLoading(false);
    return response;
  };

  return {
    materiais,
    loading,
    fetchMateriais,
    createMaterial,
    updateMaterial,
    deleteMaterial
  };
};
