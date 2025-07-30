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
        perfil_nao_encontrado: !perfil
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

  async findExistingPieces(projectId: string, newPieces: any[]) {
    console.log('🔍 Procurando peças existentes para', newPieces.length, 'peças novas');
    
    try {
      // 1. Buscar peças existentes do projeto
      const existingResult = await this.getByProjectId(projectId);
      if (!existingResult.success || !existingResult.data) {
        console.log('❌ Erro ao buscar peças existentes:', existingResult.error);
        return {
          matches: [],
          newPieces: newPieces,
          inOptimizations: [],
          stats: {
            existing: 0,
            inOptimizations: 0,
            new: newPieces.length,
            total: newPieces.length
          }
        };
      }

      const existingPieces = existingResult.data;
      console.log('📦 Peças existentes encontradas:', existingPieces.length);

      // 2. Buscar otimizações ativas para verificar peças em uso
      const { data: optimizations, error: optError } = await supabase
        .from('projeto_otimizacoes')
        .select('pecas_selecionadas')
        .eq('projeto_id', projectId);

      if (optError) {
        console.log('⚠️ Erro ao buscar otimizações:', optError);
      }

      // Extrair IDs das peças em otimizações
      const piecesInOptimizations = new Set<string>();
      if (optimizations) {
        optimizations.forEach(opt => {
          if (opt.pecas_selecionadas && Array.isArray(opt.pecas_selecionadas)) {
            opt.pecas_selecionadas.forEach((id: string) => {
              piecesInOptimizations.add(id);
            });
          }
        });
      }

      console.log('🔧 Peças em otimizações:', piecesInOptimizations.size);

      // 3. Sistema de match melhorado com múltiplos critérios
      const matches: Array<{
        newPiece: any;
        existingPiece: ProjetoPeca;
        matchType: string;
        score: number;
      }> = [];

      const unmatchedNew: any[] = [];

      newPieces.forEach(newPiece => {
        console.log(`🔍 Analisando peça nova:`, {
          posicao: newPiece.posicao,
          tag: newPiece.tag,
          perfil: newPiece.perfil,
          comprimento: newPiece.length
        });

        let bestMatch: ProjetoPeca | null = null;
        let bestScore = 0;
        let bestMatchType = '';

        existingPieces.forEach(existing => {
          let score = 0;
          let matchCriteria: string[] = [];

          // Critério 1: Posição (peso 4 - mais importante)
          if (newPiece.posicao && existing.posicao && 
              newPiece.posicao.toString().trim() === existing.posicao.toString().trim()) {
            score += 4;
            matchCriteria.push('posicao');
          }

          // Critério 2: Tag (peso 3)
          if (newPiece.tag && existing.tag && 
              newPiece.tag.toString().trim() === existing.tag.toString().trim()) {
            score += 3;
            matchCriteria.push('tag');
          }

          // Critério 3: Perfil (peso 2)
          if (newPiece.perfil && existing.descricao_perfil_raw && 
              newPiece.perfil.toString().trim() === existing.descricao_perfil_raw.toString().trim()) {
            score += 2;
            matchCriteria.push('perfil');
          }

          // Critério 4: Comprimento (peso 3 - muito importante)
          if (newPiece.length && existing.comprimento_mm && 
              Math.abs(newPiece.length - existing.comprimento_mm) < 1) {
            score += 3;
            matchCriteria.push('comprimento');
          }

          // Só considera match se tiver pelo menos critério de comprimento + outro
          if (score >= 4 && matchCriteria.includes('comprimento')) {
            if (score > bestScore) {
              bestMatch = existing;
              bestScore = score;
              bestMatchType = matchCriteria.join('_');
            }
          }
        });

        if (bestMatch) {
          console.log(`✅ Match encontrado (score: ${bestScore}):`, {
            new: { posicao: newPiece.posicao, tag: newPiece.tag, comprimento: newPiece.length },
            existing: { posicao: bestMatch.posicao, tag: bestMatch.tag, comprimento: bestMatch.comprimento_mm },
            matchType: bestMatchType
          });

          matches.push({
            newPiece,
            existingPiece: bestMatch,
            matchType: bestMatchType,
            score: bestScore
          });
        } else {
          console.log(`❌ Nenhum match encontrado para:`, {
            posicao: newPiece.posicao,
            tag: newPiece.tag,
            comprimento: newPiece.length
          });
          unmatchedNew.push(newPiece);
        }
      });

      // 4. Identificar peças em otimizações
      const inOptimizations = matches.filter(match => 
        piecesInOptimizations.has(match.existingPiece.id)
      );

      console.log('✅ Resultado da análise:');
      console.log('  - Matches encontrados:', matches.length);
      console.log('  - Peças novas:', unmatchedNew.length);
      console.log('  - Em otimizações:', inOptimizations.length);

      const stats = {
        existing: matches.length - inOptimizations.length,
        inOptimizations: inOptimizations.length,
        new: unmatchedNew.length,
        total: newPieces.length
      };

      console.log('📊 Estatísticas finais:', stats);

      return {
        matches,
        newPieces: unmatchedNew,
        inOptimizations: inOptimizations.map(m => m.existingPiece),
        stats
      };

    } catch (error: any) {
      console.error('❌ Erro em findExistingPieces:', error);
      return {
        matches: [],
        newPieces: newPieces,
        inOptimizations: [],
        stats: {
          existing: 0,
          inOptimizations: 0,
          new: newPieces.length,
          total: newPieces.length
        }
      };
    }
  }

  async updateExistingWithPhase(matches: { newPiece: any; existingPiece: ProjetoPeca; matchType: string }[]): Promise<{
    updated: ProjetoPeca[];
    errors: any[];
  }> {
    try {
      console.log(`🔄 Iniciando atualização de ${matches.length} peças com nova fase`);
      
      const updated: ProjetoPeca[] = [];
      const errors: any[] = [];

      for (const match of matches) {
        try {
          const { newPiece, existingPiece } = match;
          
          // Extrair fase da peça nova
          const novaFase = newPiece.fase || newPiece.conjunto || newPiece.set || newPiece.tag;
          
          if (!novaFase) {
            console.log(`⚠️ Peça ${existingPiece.posicao} não tem fase definida, pulando...`);
            continue;
          }

          // Verificar se a fase realmente mudou
          if (existingPiece.fase === novaFase) {
            console.log(`ℹ️ Peça ${existingPiece.posicao} já tem a fase ${novaFase}, pulando...`);
            continue;
          }

          console.log(`🔄 Atualizando peça ${existingPiece.posicao}: fase "${existingPiece.fase || 'sem fase'}" -> "${novaFase}"`);

          // Atualizar APENAS o campo fase, preservando todos os outros dados
          const updateResponse = await this.update(existingPiece.id, {
            fase: novaFase
          });

          if (updateResponse.success && updateResponse.data) {
            updated.push(updateResponse.data);
            console.log(`✅ Peça ${existingPiece.posicao} atualizada com sucesso`);
          } else {
            console.error(`❌ Erro ao atualizar peça ${existingPiece.posicao}:`, updateResponse.error);
            errors.push({
              peca: existingPiece,
              error: updateResponse.error
            });
          }

        } catch (error: any) {
          console.error(`❌ Erro inesperado ao atualizar peça ${match.existingPiece.posicao}:`, error);
          errors.push({
            peca: match.existingPiece,
            error: error.message
          });
        }
      }

      console.log(`📊 Resultado da atualização:`);
      console.log(`   - ✅ ${updated.length} peças atualizadas com sucesso`);
      console.log(`   - ❌ ${errors.length} erros encontrados`);

      return { updated, errors };

    } catch (error: any) {
      console.error('Erro inesperado no processo de atualização:', error);
      return { updated: [], errors: [{ error: error.message }] };
    }
  }
}

export const projetoPecaService = new ProjetoPecaService();