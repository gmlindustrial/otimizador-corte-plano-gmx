
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MaterialPrice {
  id: string;
  material_id: string;
  price_per_kg: number;
  price_per_m2?: number;
  effective_date: string;
  created_at: string;
}

export const useMaterialPrices = () => {
  const [prices, setPrices] = useState<MaterialPrice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('material_prices')
        .select(`
          *,
          materiais:material_id (
            tipo,
            descricao
          )
        `)
        .order('effective_date', { ascending: false });

      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error('Erro ao carregar preços:', error);
      toast.error('Erro ao carregar preços de materiais');
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = async (materialId: string, pricePerKg: number, pricePerM2?: number) => {
    try {
      const { error } = await supabase
        .from('material_prices')
        .insert({
          material_id: materialId,
          price_per_kg: pricePerKg,
          price_per_m2: pricePerM2,
          effective_date: new Date().toISOString()
        });

      if (error) throw error;
      
      await fetchPrices();
      toast.success('Preço atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar preço:', error);
      toast.error('Erro ao atualizar preço');
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  return {
    prices,
    loading,
    updatePrice,
    refetch: fetchPrices
  };
};
