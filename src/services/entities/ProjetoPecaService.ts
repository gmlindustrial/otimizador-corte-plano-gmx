import { supabase } from '@/integrations/supabase/client';
import type { ProjetoPeca, ProjectPieceValidation } from '@/types/project';
import { perfilService } from './PerfilService';

export class ProjetoPecaService {
  async getByProjectId(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('projeto_pecas')
        .select(`
          *,
          perfil:perfis_materiais(*)
        `)
        .eq('projeto_id', projectId)
        .order('tag_peca', { ascending: true });

      if (error) {
        console.error('Erro ao buscar peças do projeto:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao buscar peças do projeto:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async create(peca: Omit<ProjetoPeca, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('projeto_pecas')
        .insert([peca])
        .select(`
          *,
          perfil:perfis_materiais(*)
        `)
        .single();

      if (error) {
        console.error('Erro ao criar peça:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao criar peça:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async createBatch(pecas: Omit<ProjetoPeca, 'id' | 'created_at'>[]) {
    try {
      const { data, error } = await supabase
        .from('projeto_pecas')
        .insert(pecas)
        .select(`
          *,
          perfil:perfis_materiais(*)
        `);

      if (error) {
        console.error('Erro ao criar peças em lote:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao criar peças em lote:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async validateAndProcessPieces(pieces: any[], projectId: string): Promise<{
    validPieces: ProjetoPeca[];
    invalidPieces: ProjectPieceValidation[];
  }> {
    const validPieces: ProjetoPeca[] = [];
    const invalidPieces: ProjectPieceValidation[] = [];

    for (const piece of pieces) {
      // Tentar encontrar perfil correspondente
      const perfil = await perfilService.findBestMatch(piece.profile || piece.perfil || piece.descricao);
      
      const peca: Omit<ProjetoPeca, 'id' | 'created_at'> = {
        projeto_id: projectId,
        tag_peca: piece.tag || piece.tag_peca || `Peça ${pieces.indexOf(piece) + 1}`,
        conjunto: piece.conjunto || piece.set,
        perfil_id: perfil?.id,
        descricao_perfil_raw: piece.profile || piece.perfil || piece.descricao,
        comprimento_mm: piece.length || piece.comprimento || piece.comprimento_mm,
        quantidade: piece.quantity || piece.quantidade || 1,
        peso_por_metro: perfil?.kg_por_metro,
        perfil_nao_encontrado: !perfil
      };

      if (perfil) {
        validPieces.push(peca as ProjetoPeca);
      } else {
        // Buscar sugestões de perfis similares
        const suggestions = await perfilService.searchByDescription(
          piece.profile || piece.perfil || piece.descricao
        );

        invalidPieces.push({
          peca: peca as ProjetoPeca,
          isValid: false,
          suggestions: suggestions.success ? suggestions.data?.slice(0, 5) || [] : []
        });
      }
    }

    return { validPieces, invalidPieces };
  }

  async update(id: string, peca: Partial<ProjetoPeca>) {
    try {
      const { data, error } = await supabase
        .from('projeto_pecas')
        .update(peca)
        .eq('id', id)
        .select(`
          *,
          perfil:perfis_materiais(*)
        `)
        .single();

      if (error) {
        console.error('Erro ao atualizar peça:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao atualizar peça:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('projeto_pecas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar peça:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data: null, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao deletar peça:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async getGroupedByProfile(projectId: string) {
    try {
      const response = await this.getByProjectId(projectId);
      if (!response.success || !response.data) {
        return response;
      }

      const grouped = response.data.reduce((acc: any, peca: ProjetoPeca) => {
        const key = peca.perfil_id || 'sem_perfil';
        if (!acc[key]) {
          acc[key] = {
            perfil: peca.perfil,
            descricao: peca.perfil?.descricao_perfil || peca.descricao_perfil_raw,
            pecas: [],
            total_quantidade: 0,
            total_comprimento: 0
          };
        }
        
        acc[key].pecas.push(peca);
        acc[key].total_quantidade += peca.quantidade;
        acc[key].total_comprimento += peca.comprimento_mm * peca.quantidade;
        
        return acc;
      }, {});

      return { success: true, data: Object.values(grouped), error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao agrupar peças por perfil:', error);
      return { success: false, data: null, error: error.message };
    }
  }
}

export const projetoPecaService = new ProjetoPecaService();