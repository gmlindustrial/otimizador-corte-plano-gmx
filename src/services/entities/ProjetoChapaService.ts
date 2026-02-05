import { supabase } from '@/integrations/supabase/client';
import type { ProjetoChapa, ProjetoChapaGroup } from '@/types/project';
import type { SheetInventorPiece } from '@/components/file-upload/FileParsingService';
import { materialService } from './MaterialService';

export class ProjetoChapaService {
  async getByProjectId(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('projeto_chapas')
        .select(`
          *,
          material:materiais(*)
        `)
        .eq('projeto_id', projectId)
        .order('posicao', { ascending: true });

      if (error) {
        console.error('Erro ao buscar chapas do projeto:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data: data as ProjetoChapa[], error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao buscar chapas do projeto:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async create(chapa: Omit<ProjetoChapa, 'id' | 'created_at' | 'material'>) {
    try {
      const { data, error } = await supabase
        .from('projeto_chapas')
        .insert([chapa])
        .select(`
          *,
          material:materiais(*)
        `)
        .single();

      if (error) {
        console.error('Erro ao criar chapa:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data: data as ProjetoChapa, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao criar chapa:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async createBatch(chapas: Omit<ProjetoChapa, 'id' | 'created_at' | 'material'>[]) {
    try {
      if (chapas.length === 0) {
        return { success: true, data: [], error: null };
      }

      // Gerar chave unica para comparacao (mesma logica da constraint do banco)
      const getKey = (c: { tag: string; posicao: string; largura_mm: number; altura_mm: number; espessura_mm?: number }) => {
        const espessura = c.espessura_mm?.toString() ?? '';
        return `${c.tag}|${c.posicao}|${c.largura_mm}|${c.altura_mm}|${espessura}`;
      };

      // Buscar chapas existentes do projeto para verificar duplicatas
      const projectId = chapas[0].projeto_id;
      const { data: existingChapas } = await supabase
        .from('projeto_chapas')
        .select('tag, posicao, largura_mm, altura_mm, espessura_mm')
        .eq('projeto_id', projectId);

      // Criar set de chaves existentes no banco
      const existingKeys = new Set<string>();
      if (existingChapas) {
        existingChapas.forEach(c => existingKeys.add(getKey(c as any)));
      }

      // Filtrar chapas removendo duplicatas do banco E duplicatas internas
      const seenKeys = new Set<string>();
      const newChapas: typeof chapas = [];
      let skippedCount = 0;

      for (const chapa of chapas) {
        const key = getKey(chapa);

        if (existingKeys.has(key)) {
          console.log(`⏭️ Chapa ja existe no banco: ${chapa.posicao} (${key})`);
          skippedCount++;
          continue;
        }

        if (seenKeys.has(key)) {
          console.log(`⏭️ Chapa duplicada no arquivo: ${chapa.posicao} (${key})`);
          skippedCount++;
          continue;
        }

        seenKeys.add(key);
        newChapas.push(chapa);
      }

      if (skippedCount > 0) {
        console.log(`⚠️ ${skippedCount} chapa(s) ignorada(s) (duplicatas)`);
      }

      if (newChapas.length === 0) {
        console.log('ℹ️ Todas as chapas ja existem ou sao duplicatas');
        return { success: true, data: [], error: null, skipped: skippedCount };
      }

      console.log(`📦 Inserindo ${newChapas.length} chapa(s) nova(s)...`);

      const { data, error } = await supabase
        .from('projeto_chapas')
        .insert(newChapas)
        .select(`
          *,
          material:materiais(*)
        `);

      if (error) {
        console.error('Erro ao criar chapas em lote:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data: data as ProjetoChapa[], error: null, skipped: skippedCount };
    } catch (error: any) {
      console.error('Erro inesperado ao criar chapas em lote:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Processa chapas do Inventor, tentando vincular a materiais existentes
   */
  async validateAndProcessChapas(
    sheetPieces: SheetInventorPiece[],
    projectId: string
  ): Promise<{
    chapas: Omit<ProjetoChapa, 'id' | 'created_at' | 'material'>[];
    chapasComMaterial: number;
    chapasSemMaterial: number;
  }> {
    // Buscar materiais de chapa disponiveis
    const materiaisResult = await materialService.getByTipoCorte('chapa');
    const materiais = materiaisResult.success && materiaisResult.data ? materiaisResult.data : [];

    const chapas: Omit<ProjetoChapa, 'id' | 'created_at' | 'material'>[] = [];
    let chapasComMaterial = 0;
    let chapasSemMaterial = 0;

    for (const piece of sheetPieces) {
      // Tentar encontrar material correspondente
      const materialEncontrado = this.findMaterialMatch(piece, materiais);

      const chapa: Omit<ProjetoChapa, 'id' | 'created_at' | 'material'> = {
        projeto_id: projectId,
        tag: piece.tag,
        posicao: piece.posicao,
        descricao: piece.descricao,
        largura_mm: piece.width,
        altura_mm: piece.height,
        espessura_mm: piece.thickness,
        material_id: materialEncontrado?.id,
        material_descricao_raw: piece.descricao,
        material_nao_encontrado: !materialEncontrado,
        quantidade: piece.quantity,
        peso: piece.peso,
        fase: piece.fase,
        status: 'aguardando_otimizacao'
      };

      chapas.push(chapa);

      if (materialEncontrado) {
        chapasComMaterial++;
        console.log(`✅ Material encontrado para chapa ${chapa.tag}: ${materialEncontrado.descricao}`);
      } else {
        chapasSemMaterial++;
        console.log(`❌ Material nao encontrado para chapa ${chapa.tag}: ${piece.descricao}`);
      }
    }

    console.log(`📊 Processamento de chapas: ${chapasComMaterial} com material, ${chapasSemMaterial} sem material`);

    return { chapas, chapasComMaterial, chapasSemMaterial };
  }

  /**
   * Tenta encontrar um material que corresponda a chapa
   */
  private findMaterialMatch(
    piece: SheetInventorPiece,
    materiais: any[]
  ): any | null {
    const descLower = piece.descricao.toLowerCase();

    // Estrategia 1: Match exato por descricao
    const exactMatch = materiais.find(m =>
      m.descricao?.toLowerCase() === descLower
    );
    if (exactMatch) return exactMatch;

    // Estrategia 2: Match por espessura na descricao
    if (piece.thickness) {
      const thicknessStr = piece.thickness.toString().replace('.', ',');
      const thicknessMatch = materiais.find(m => {
        const matDesc = m.descricao?.toLowerCase() || '';
        return matDesc.includes(thicknessStr) ||
               matDesc.includes(piece.thickness!.toString());
      });
      if (thicknessMatch) return thicknessMatch;
    }

    // Estrategia 3: Match parcial por descricao
    const partialMatch = materiais.find(m => {
      const matDesc = m.descricao?.toLowerCase() || '';
      return matDesc.includes(descLower) || descLower.includes(matDesc);
    });
    if (partialMatch) return partialMatch;

    return null;
  }

  async update(id: string, chapa: Partial<ProjetoChapa>) {
    try {
      // Remover campo material do update pois e um join
      const { material, ...chapaData } = chapa;

      const { data, error } = await supabase
        .from('projeto_chapas')
        .update(chapaData)
        .eq('id', id)
        .select(`
          *,
          material:materiais(*)
        `)
        .single();

      if (error) {
        console.error('Erro ao atualizar chapa:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data: data as ProjetoChapa, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao atualizar chapa:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('projeto_chapas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar chapa:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data: null, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao deletar chapa:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  async deleteByProjectId(projectId: string) {
    try {
      const { error } = await supabase
        .from('projeto_chapas')
        .delete()
        .eq('projeto_id', projectId);

      if (error) {
        console.error('Erro ao deletar chapas do projeto:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data: null, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao deletar chapas do projeto:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Agrupa chapas por espessura + material para otimizacao
   * Chapas com mesma espessura e material podem ser otimizadas juntas
   * IMPORTANTE: Filtra apenas chapas aguardando otimização
   */
  async getGroupedByEspessuraEMaterial(projectId: string): Promise<{
    success: boolean;
    data: ProjetoChapaGroup[] | null;
    error: string | null;
  }> {
    try {
      // Buscar apenas chapas aguardando otimização (não mostra chapas já otimizadas)
      const { data, error } = await supabase
        .from('projeto_chapas')
        .select(`*, material:materiais(*)`)
        .eq('projeto_id', projectId)
        .eq('status', 'aguardando_otimizacao')
        .order('posicao', { ascending: true });

      if (error) {
        console.error('Erro ao buscar chapas para agrupamento:', error);
        return { success: false, data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: true, data: [], error: null };
      }

      const grouped = (data as ProjetoChapa[]).reduce((acc: Record<string, ProjetoChapaGroup>, chapa: ProjetoChapa) => {
        // Chave de agrupamento: espessura + material_id
        const espessura = chapa.espessura_mm || 0;
        const materialId = chapa.material_id || 'sem_material';
        const key = `${espessura}_${materialId}`;

        if (!acc[key]) {
          acc[key] = {
            espessura_mm: espessura,
            material_id: chapa.material_id,
            material: chapa.material,
            chapas: [],
            total_quantidade: 0,
            total_area_mm2: 0
          };
        }

        acc[key].chapas.push(chapa);
        acc[key].total_quantidade += chapa.quantidade;
        acc[key].total_area_mm2 += (chapa.largura_mm * chapa.altura_mm * chapa.quantidade);

        return acc;
      }, {});

      // Ordenar por espessura
      const groups = Object.values(grouped).sort((a, b) => a.espessura_mm - b.espessura_mm);

      return { success: true, data: groups, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao agrupar chapas:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Retorna estatisticas das chapas do projeto
   */
  async getStatistics(projectId: string): Promise<{
    success: boolean;
    data: {
      total: number;
      aguardandoOtimizacao: number;
      otimizadas: number;
      cortadas: number;
      semMaterial: number;
    } | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('projeto_chapas')
        .select('quantidade, status, material_nao_encontrado')
        .eq('projeto_id', projectId);

      if (error) {
        console.error('Erro ao buscar estatisticas de chapas:', error);
        return { success: false, data: null, error: error.message };
      }

      const stats = {
        total: 0,
        aguardandoOtimizacao: 0,
        otimizadas: 0,
        cortadas: 0,
        semMaterial: 0
      };

      data?.forEach(chapa => {
        const qty = chapa.quantidade || 1;
        stats.total += qty;

        switch (chapa.status) {
          case 'aguardando_otimizacao':
            stats.aguardandoOtimizacao += qty;
            break;
          case 'otimizada':
            stats.otimizadas += qty;
            break;
          case 'cortada':
            stats.cortadas += qty;
            break;
        }

        if (chapa.material_nao_encontrado) {
          stats.semMaterial += qty;
        }
      });

      return { success: true, data: stats, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao buscar estatisticas de chapas:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Atualiza material de varias chapas de uma vez
   * Usado quando usuario resolve validacao de material
   */
  async updateMaterialBatch(chapaIds: string[], materialId: string) {
    try {
      const { data, error } = await supabase
        .from('projeto_chapas')
        .update({
          material_id: materialId,
          material_nao_encontrado: false
        })
        .in('id', chapaIds)
        .select(`
          *,
          material:materiais(*)
        `);

      if (error) {
        console.error('Erro ao atualizar material das chapas:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data: data as ProjetoChapa[], error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao atualizar material das chapas:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Atualiza status de varias chapas
   */
  async updateStatus(chapaIds: string[], status: ProjetoChapa['status'], optimizationId?: string) {
    try {
      const updateData: any = { status };
      if (optimizationId) {
        updateData.projeto_otimizacao_chapa_id = optimizationId;
      }

      const { data, error } = await supabase
        .from('projeto_chapas')
        .update(updateData)
        .in('id', chapaIds)
        .select();

      if (error) {
        console.error('Erro ao atualizar status das chapas:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao atualizar status das chapas:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Busca chapas sem material cadastrado
   */
  async getWithoutMaterial(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('projeto_chapas')
        .select(`
          *,
          material:materiais(*)
        `)
        .eq('projeto_id', projectId)
        .eq('material_nao_encontrado', true)
        .order('descricao', { ascending: true });

      if (error) {
        console.error('Erro ao buscar chapas sem material:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data: data as ProjetoChapa[], error: null };
    } catch (error: any) {
      console.error('Erro inesperado ao buscar chapas sem material:', error);
      return { success: false, data: null, error: error.message };
    }
  }
}

export const projetoChapaService = new ProjetoChapaService();
