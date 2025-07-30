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

  async findExistingPieces(projectId: string, newPieces: any[]): Promise<{
    existing: ProjetoPeca[];
    inOptimizations: { peca: ProjetoPeca; optimization: any }[];
    new: any[];
    matches: { newPiece: any; existingPiece: ProjetoPeca; matchType: 'posicao' | 'tag' | 'comprimento' }[];
  }> {
    try {
      console.log(`🔍 Iniciando comparação de peças para projeto ${projectId}`);
      
      // Buscar peças existentes do projeto
      const existingResponse = await this.getByProjectId(projectId);
      if (!existingResponse.success || !existingResponse.data) {
        console.log('❌ Erro ao buscar peças existentes:', existingResponse.error);
        return { existing: [], inOptimizations: [], new: newPieces, matches: [] };
      }

      const existingPieces = existingResponse.data;
      console.log(`📦 Encontradas ${existingPieces.length} peças existentes no projeto`);

      // Buscar peças em otimizações ativas - query direta para evitar import circular
      const { data: optimizations = [] } = await supabase
        .from('projeto_otimizacoes')
        .select('pecas_selecionadas')
        .eq('projeto_id', projectId);
      
      console.log(`⚙️ Encontradas ${optimizations.length} otimizações do projeto`);

      // Criar mapas para busca rápida
      const posicaoMap = new Map<string, ProjetoPeca>();
      const tagMap = new Map<string, ProjetoPeca>();
      const comprimentoMap = new Map<string, ProjetoPeca[]>();

      existingPieces.forEach(peca => {
        // Indexar por posição
        if (peca.posicao) {
          posicaoMap.set(peca.posicao.toLowerCase().trim(), peca);
        }

        // Indexar por tag
        if (peca.tag) {
          tagMap.set(peca.tag.toLowerCase().trim(), peca);
        }

        // Indexar por comprimento
        const comprimentoKey = `${peca.comprimento_mm}_${peca.descricao_perfil_raw || ''}`;
        if (!comprimentoMap.has(comprimentoKey)) {
          comprimentoMap.set(comprimentoKey, []);
        }
        comprimentoMap.get(comprimentoKey)!.push(peca);
      });

      // Identificar peças que estão em otimizações
      const optimizedPiecesIds = new Set<string>();
      optimizations.forEach(opt => {
        if (opt.pecas_selecionadas && Array.isArray(opt.pecas_selecionadas)) {
          opt.pecas_selecionadas.forEach(id => {
            if (typeof id === 'string') {
              optimizedPiecesIds.add(id);
            }
          });
        }
      });

      const inOptimizations: { peca: ProjetoPeca; optimization: any }[] = [];
      existingPieces.forEach(peca => {
        if (optimizedPiecesIds.has(peca.id)) {
          const optimization = optimizations.find(opt => 
            Array.isArray(opt.pecas_selecionadas) && 
            opt.pecas_selecionadas.some(id => typeof id === 'string' && id === peca.id)
          );
          if (optimization) {
            inOptimizations.push({ peca, optimization });
          }
        }
      });

      console.log(`🔧 ${inOptimizations.length} peças estão em otimizações ativas`);

      // Comparar peças novas com existentes
      const matches: { newPiece: any; existingPiece: ProjetoPeca; matchType: 'posicao' | 'tag' | 'comprimento' }[] = [];
      const matchedNewPieces = new Set<number>();
      const matchedExistingPieces = new Set<string>();

      newPieces.forEach((newPiece, index) => {
        let match: ProjetoPeca | null = null;
        let matchType: 'posicao' | 'tag' | 'comprimento' | null = null;

        // 1. Prioridade: Comparar por posição
        const posicao = newPiece.posicao || newPiece.tag || `PEÇA-${index + 1}`;
        if (posicao && posicaoMap.has(posicao.toLowerCase().trim())) {
          match = posicaoMap.get(posicao.toLowerCase().trim())!;
          matchType = 'posicao';
          console.log(`✅ Match por posição: ${posicao} -> ${match.posicao}`);
        }

        // 2. Segundo: Comparar por tag (se ambos tiverem)
        if (!match && newPiece.tag && tagMap.has(newPiece.tag.toLowerCase().trim())) {
          match = tagMap.get(newPiece.tag.toLowerCase().trim())!;
          matchType = 'tag';
          console.log(`✅ Match por tag: ${newPiece.tag} -> ${match.tag}`);
        }

        // 3. Terceiro: Comparar por comprimento + descrição do perfil
        if (!match) {
          const comprimento = newPiece.length || newPiece.comprimento || newPiece.comprimento_mm;
          const perfil = newPiece.profile || newPiece.perfil || newPiece.descricao;
          
          if (comprimento && perfil) {
            const comprimentoKey = `${comprimento}_${perfil}`;
            const candidatos = comprimentoMap.get(comprimentoKey);
            
            if (candidatos && candidatos.length > 0) {
              // Pegar o primeiro candidato que ainda não foi matched
              match = candidatos.find(c => !matchedExistingPieces.has(c.id)) || null;
              if (match) {
                matchType = 'comprimento';
                console.log(`✅ Match por comprimento+perfil: ${comprimento}mm ${perfil} -> ${match.posicao}`);
              }
            }
          }
        }

        if (match && matchType) {
          matches.push({ newPiece, existingPiece: match, matchType });
          matchedNewPieces.add(index);
          matchedExistingPieces.add(match.id);
        }
      });

      // Separar peças novas (que não tiveram match)
      const newUnmatchedPieces = newPieces.filter((_, index) => !matchedNewPieces.has(index));

      console.log(`📊 Resultado da comparação:`);
      console.log(`   - ${matches.length} peças com correspondência encontrada`);
      console.log(`   - ${newUnmatchedPieces.length} peças completamente novas`);
      console.log(`   - ${inOptimizations.length} peças em otimizações ativas`);

      return {
        existing: existingPieces,
        inOptimizations,
        new: newUnmatchedPieces,
        matches
      };

    } catch (error: any) {
      console.error('Erro inesperado ao comparar peças:', error);
      return { existing: [], inOptimizations: [], new: newPieces, matches: [] };
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