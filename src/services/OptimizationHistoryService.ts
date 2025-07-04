
import { supabase } from '@/integrations/supabase/client';
import type { Project, OptimizationResult, CutPiece } from '@/pages/Index';

export interface OptimizationHistoryEntry {
  id: string;
  project: Project;
  pieces: CutPiece[];
  results: OptimizationResult;
  date: string;
  barLength: number;
}

export class OptimizationHistoryService {
  static async loadHistory(): Promise<OptimizationHistoryEntry[]> {
    const { data, error } = await supabase
      .from('historico_otimizacoes')
      .select(`
        *,
        projetos (
          *,
          clientes (nome),
          obras (nome),
          operadores (nome),
          inspetores_qa (nome),
          materiais (tipo)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.convertFromDatabase).filter(Boolean) as OptimizationHistoryEntry[];
  }

  static async saveHistoryEntry(
    project: Project,
    pieces: CutPiece[],
    results: OptimizationResult,
    barLength: number,
    savedProjectId: string | null
  ): Promise<OptimizationHistoryEntry> {
    const historyData = {
      projeto_id: savedProjectId,
      bar_length: barLength,
      pecas: pieces as any,
      resultados: results as any
    };

    const { data, error } = await supabase
      .from('historico_otimizacoes')
      .insert(historyData)
      .select(`
        *,
        projetos (
          *,
          clientes (nome),
          obras (nome),
          operadores (nome),
          inspetores_qa (nome),
          materiais (tipo)
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      project,
      pieces: [...pieces],
      results,
      date: data.created_at,
      barLength
    };
  }

  static async clearHistory(): Promise<void> {
    const { error } = await supabase
      .from('historico_otimizacoes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;
  }

  static async removeEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('historico_otimizacoes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private static convertFromDatabase(dbEntry: any): OptimizationHistoryEntry | null {
    try {
      const projeto = dbEntry.projetos;
      
      return {
        id: dbEntry.id,
        project: {
          id: projeto?.id || 'temp-' + dbEntry.id,
          name: projeto?.nome || 'Projeto Carregado',
          projectNumber: projeto?.numero_projeto || 'TEMP-001',
          client: projeto?.clientes?.nome || 'Cliente',
          obra: projeto?.obras?.nome || 'Obra',
          lista: projeto?.lista || 'LISTA 01',
          revisao: projeto?.revisao || 'REV-00',
          tipoMaterial: projeto?.materiais?.tipo || 'Material',
          operador: projeto?.operadores?.nome || 'Operador',
          turno: projeto?.turno || '1',
          aprovadorQA: projeto?.inspetores_qa?.nome || 'QA',
          validacaoQA: projeto?.validacao_qa || true,
          enviarSobrasEstoque: projeto?.enviar_sobras_estoque || false,
          qrCode: projeto?.qr_code || '',
          date: dbEntry.created_at
        },
        pieces: dbEntry.pecas || [],
        results: dbEntry.resultados || { bars: [], totalBars: 0, totalWaste: 0, wastePercentage: 0, efficiency: 0 },
        date: dbEntry.created_at,
        barLength: dbEntry.bar_length || 6000
      };
    } catch (error) {
      console.error('Erro ao converter entrada do histórico:', error);
      return null;
    }
  }
}
