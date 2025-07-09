import { supabase } from '@/integrations/supabase/client';
import type { PerfilMaterial } from '@/types/project';

export class PerfilService {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('perfis_materiais')
        .select('*')
        .order('tipo_perfil', { ascending: true })
        .order('descricao_perfil', { ascending: true });

      if (error) {
        console.error('Erro ao buscar perfis:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao buscar perfis:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async searchByDescription(description: string) {
    try {
      const { data, error } = await supabase
        .from('perfis_materiais')
        .select('*')
        .ilike('descricao_perfil', `%${description}%`)
        .order('descricao_perfil', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar perfis por descrição:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao buscar perfis por descrição:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async findBestMatch(description: string): Promise<PerfilMaterial | null> {
    try {
      const response = await this.searchByDescription(description);
      if (!response.success || !response.data || response.data.length === 0) {
        return null;
      }

      // Busca correspondência exata primeiro
      const exactMatch = response.data.find(
        (perfil: PerfilMaterial) => 
          perfil.descricao_perfil.toLowerCase() === description.toLowerCase()
      );

      if (exactMatch) {
        return exactMatch;
      }

      // Se não houver correspondência exata, retorna o primeiro resultado
      return response.data[0];
    } catch (error) {
      console.error('Erro ao buscar melhor correspondência:', error);
      return null;
    }
  }

  async create(perfil: Omit<PerfilMaterial, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('perfis_materiais')
        .insert([perfil])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar perfil:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao criar perfil:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async update(id: string, perfil: Partial<PerfilMaterial>) {
    try {
      const { data, error } = await supabase
        .from('perfis_materiais')
        .update(perfil)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao atualizar perfil:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('perfis_materiais')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar perfil:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data: null, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao deletar perfil:', error);
      return { success: false, data: null, error: error.message };
    }
  }
}

export const perfilService = new PerfilService();