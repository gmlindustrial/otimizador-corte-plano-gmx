import { useState, useEffect } from 'react';
import { perfilService } from '@/services/entities/PerfilService';
import type { PerfilMaterial } from '@/types/project';
import { useToast } from '@/hooks/use-toast';

export const usePerfilService = () => {
  const [perfis, setPerfis] = useState<PerfilMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPerfis = async () => {
    setLoading(true);
    try {
      const response = await perfilService.getAll();
      if (response.success && response.data) {
        setPerfis(response.data);
      } else {
        console.error('Erro ao buscar perfis:', response.error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os perfis de materiais.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar perfis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPerfil = async (perfilData: Omit<PerfilMaterial, 'id' | 'created_at'>) => {
    setLoading(true);
    try {
      const response = await perfilService.create(perfilData);
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Perfil criado com sucesso!",
        });
        await fetchPerfis();
        return true;
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao criar perfil.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar perfil.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePerfil = async (id: string, perfilData: Partial<PerfilMaterial>) => {
    setLoading(true);
    try {
      const response = await perfilService.update(id, perfilData);
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso!",
        });
        await fetchPerfis();
        return true;
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao atualizar perfil.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar perfil.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deletePerfil = async (id: string) => {
    setLoading(true);
    try {
      const response = await perfilService.delete(id);
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Perfil excluído com sucesso!",
        });
        await fetchPerfis();
        return true;
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao excluir perfil.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao excluir perfil:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir perfil.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const searchPerfis = async (description: string) => {
    setLoading(true);
    try {
      const response = await perfilService.searchByDescription(description);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerfis();
  }, []);

  return {
    perfis,
    loading,
    fetchPerfis,
    createPerfil,
    updatePerfil,
    deletePerfil,
    searchPerfis
  };
};