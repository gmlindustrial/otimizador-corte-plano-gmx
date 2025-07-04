
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
      .select('*')
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
      .select()
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
      return {
        id: dbEntry.id,
        project: dbEntry.projeto_data || {
          id: 'temp-' + dbEntry.id,
          name: 'Projeto Carregado',
          projectNumber: 'TEMP-001',
          client: 'Cliente',
          obra: 'Obra',
          lista: 'LISTA 01',
          revisao: 'REV-00',
          tipoMaterial: 'Material',
          operador: 'Operador',
          turno: '1',
          aprovadorQA: 'QA',
          validacaoQA: true,
          enviarSobrasEstoque: false,
          qrCode: '',
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
