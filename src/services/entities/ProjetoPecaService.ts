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
        .order('posicao', { ascending: true });

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
    allPieces: ProjetoPeca[]; // TODAS as peças para salvar (com e sem perfil)
    invalidPieces: ProjectPieceValidation[]; // Apenas para exibir alertas
    stats: {
      total: number;
      withProfile: number;
      withoutProfile: number;
      pages: number[];
      conjuntos: string[];
    };
  }> {
    const allPieces: ProjetoPeca[] = [];
    const invalidPieces: ProjectPieceValidation[] = [];

    for (const piece of pieces) {
      // Tentar encontrar perfil correspondente usando descrição normalizada
      const perfilDescription = piece.profile || piece.perfil || piece.descricao;
      const perfil = await perfilService.findBestMatch(perfilDescription);
      
      const peca: Omit<ProjetoPeca, 'id' | 'created_at'> = {
        projeto_id: projectId,
        posicao: piece.posicao || piece.tag || `PEÇA-${pieces.indexOf(piece) + 1}`,
        tag: piece.tag || piece.conjunto || piece.set,
        fase: piece.fase || piece.conjunto, // Campo FASE
        perfil_id: perfil?.id,
        descricao_perfil_raw: perfilDescription,
        comprimento_mm: piece.length || piece.comprimento || piece.comprimento_mm,
        quantidade: piece.quantity || piece.quantidade || 1,
        // PRIORIZAR peso do perfil cadastrado no Supabase
        peso_por_metro: perfil?.kg_por_metro || 1.0,
        peso: piece.peso, // Peso total da peça extraído do arquivo
        perfil_nao_encontrado: !perfil,
        status: 'aguardando_otimizacao'
      };

      // SEMPRE adicionar à lista de peças para salvar
      allPieces.push(peca as ProjetoPeca);

      if (perfil) {
        console.log(`✅ Perfil encontrado para ${peca.posicao}: ${perfil.descricao_perfil} (${perfil.kg_por_metro} kg/m)`);
      } else {
        console.log(`❌ Perfil não encontrado para ${peca.posicao}: ${perfilDescription}`);
        
        // Buscar sugestões de perfis similares
        const suggestions = await perfilService.searchByDescription(perfilDescription);

        // Adicionar à lista de validações apenas para exibir alertas
        invalidPieces.push({
          peca: peca as ProjetoPeca,
          isValid: false,
          suggestions: suggestions.success ? suggestions.data?.slice(0, 5) || [] : []
        });
      }
    }

    // Gerar estatísticas
    const stats = {
      total: pieces.length,
      withProfile: allPieces.filter(p => !p.perfil_nao_encontrado).length,
      withoutProfile: allPieces.filter(p => p.perfil_nao_encontrado).length,
      pages: [...new Set(pieces.map(p => p.page).filter(Boolean))],
      conjuntos: [...new Set(pieces.map(p => p.tag || p.conjunto || p.set).filter(Boolean))]
    };

    console.log('📊 Estatísticas do processamento:', stats);
    console.log(`📦 Total de peças para salvar: ${allPieces.length}`);
    console.log(`⚠️ Peças sem perfil (precisam ser resolvidas): ${invalidPieces.length}`);

    return { allPieces, invalidPieces, stats };
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

  async getByStatus(projectId: string, status: ProjetoPeca['status']) {
    try {
      const { data, error } = await supabase
        .from('projeto_pecas')
        .select(`
          *,
          perfil:perfis_materiais(*)
        `)
        .eq('projeto_id', projectId)
        .eq('status', status)
        .order('posicao', { ascending: true });

      if (error) {
        console.error('Erro ao buscar peças por status:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao buscar peças por status:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async updateStatus(pieceIds: string[], status: ProjetoPeca['status'], optimizationId?: string) {
    try {
      const updateData: any = { status };
      if (optimizationId) {
        updateData.projeto_otimizacao_id = optimizationId;
      }

      const { data, error } = await supabase
        .from('projeto_pecas')
        .update(updateData)
        .in('id', pieceIds)
        .select();

      if (error) {
        console.error('Erro ao atualizar status das peças:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao atualizar status das peças:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async getStatistics(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('projeto_pecas')
        .select('status, quantidade')
        .eq('projeto_id', projectId);

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return { success: false, data: null, error: error.message };
      }

      const stats = {
        total: 0,
        aguardandoOtimizacao: 0,
        otimizadas: 0,
        cortadas: 0
      };

      data?.forEach(peca => {
        stats.total += peca.quantidade;
        switch (peca.status) {
          case 'aguardando_otimizacao':
            stats.aguardandoOtimizacao += peca.quantidade;
            break;
          case 'otimizada':
            stats.otimizadas += peca.quantidade;
            break;
          case 'cortada':
            stats.cortadas += peca.quantidade;
            break;
        }
      });

      return { success: true, data: stats, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao buscar estatísticas:', error);
      return { success: false, data: null, error: error.message };
    }
  }
}

export const projetoPecaService = new ProjetoPecaService();