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
      // Normalizar a descrição de entrada
      const normalizedDescription = this.normalizeDescription(description);
      
      const response = await this.searchByDescription(description);
      if (!response.success || !response.data || response.data.length === 0) {
        // Tentar busca com descrição normalizada
        const normalizedResponse = await this.searchByDescription(normalizedDescription);
        if (!normalizedResponse.success || !normalizedResponse.data || normalizedResponse.data.length === 0) {
          return null;
        }
        return this.findClosestMatch(normalizedDescription, normalizedResponse.data);
      }

      // Busca correspondência exata primeiro
      const exactMatch = response.data.find(
        (perfil: PerfilMaterial) => 
          this.normalizeDescription(perfil.descricao_perfil) === normalizedDescription
      );

      if (exactMatch) {
        return exactMatch;
      }

      // Buscar correspondência mais próxima
      return this.findClosestMatch(normalizedDescription, response.data);
    } catch (error) {
      console.error('Erro ao buscar melhor correspondência:', error);
      return null;
    }
  }

  private normalizeDescription(description: string): string {
    return description
      .replace(/\s+/g, '') // Remove espaços
      .replace(/X/gi, 'X') // Padroniza X
      .replace(/x/g, 'X')
      .toUpperCase();
  }

  private findClosestMatch(target: string, profiles: PerfilMaterial[]): PerfilMaterial | null {
    let bestMatch: PerfilMaterial | null = null;
    let bestScore = 0;

    for (const profile of profiles) {
      const normalized = this.normalizeDescription(profile.descricao_perfil);
      const score = this.calculateSimilarity(target, normalized);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = profile;
      }
    }

    // Retorna apenas se a similaridade for razoável (>60%)
    return bestScore > 0.6 ? bestMatch : profiles[0];
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
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