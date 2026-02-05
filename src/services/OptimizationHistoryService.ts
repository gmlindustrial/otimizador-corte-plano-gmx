
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
          obras (nome)
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
    barLength: number
  ): Promise<OptimizationHistoryEntry> {
    try {
      // Primeiro, verificar se o projeto já existe no banco
      let savedProjectId: string | null = null;
      
      const { data: existingProject, error: searchError } = await supabase
        .from('projetos')
        .select('id')
        .eq('numero_projeto', project.projectNumber)
        .maybeSingle();

      if (searchError) {
        console.error('Erro ao buscar projeto existente:', searchError);
      }

      if (existingProject) {
        // Projeto já existe, usar o ID existente
        savedProjectId = existingProject.id;
        console.log('Projeto já existe, usando ID:', savedProjectId);
      } else {
        // Projeto não existe, criar novo
        savedProjectId = await this.createProject(project, pieces, results, barLength);
        console.log('Projeto criado com ID:', savedProjectId);
      }

      // Agora salvar a entrada no histórico
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
            obras (nome)
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
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
      throw error;
    }
  }

  private static async createProject(
    project: Project,
    pieces: CutPiece[],
    results: OptimizationResult,
    barLength: number
  ): Promise<string | null> {
    try {
      // Buscar IDs das entidades pelos nomes
      const clienteId = await this.findClienteIdByName(project.client);
      const obraId = await this.findObraIdByName(project.obra);
      const materialId = await this.findMaterialIdByType(project.tipoMaterial);
      const operadorId = await this.findOperadorIdByName(project.operador);
      const inspetorId = await this.findInspetorIdByName(project.aprovadorQA);

      // Preparar dados do projeto
      const projectDataForDb = {
        type: 'linear',
        client: project.client,
        obra: project.obra,
        tipoMaterial: project.tipoMaterial,
        operador: project.operador,
        aprovadorQA: project.aprovadorQA,
        pieces: pieces,
        barLength,
        originalProjectId: project.id
      };

      const insertData = {
        nome: project.name,
        numero_projeto: project.projectNumber,
        cliente_id: clienteId,
        obra_id: obraId,
        material_id: materialId,
        operador_id: operadorId,
        inspetor_id: inspetorId,
        turno: project.turno,
        lista: project.lista,
        revisao: project.revisao,
        validacao_qa: project.validacaoQA,
        enviar_sobras_estoque: project.enviarSobrasEstoque,
        qr_code: project.qrCode,
        dados_projeto: projectDataForDb as any
      };

      const { data: result, error } = await supabase
        .from('projetos')
        .insert(insertData)
        .select('id')
        .single();

      if (error) throw error;

      return result.id;
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      return null;
    }
  }

  // Helper methods para buscar IDs por nomes
  private static async findClienteIdByName(clienteName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id')
        .eq('nome', clienteName)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
  }

  private static async findObraIdByName(obraName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('id')
        .eq('nome', obraName)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar obra:', error);
      return null;
    }
  }

  private static async findMaterialIdByType(materialType: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('id')
        .eq('tipo', materialType)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar material:', error);
      return null;
    }
  }

  private static async findOperadorIdByName(operadorName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('id')
        .eq('nome', operadorName)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar operador:', error);
      return null;
    }
  }

  private static async findInspetorIdByName(inspetorName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('inspetores_qa')
        .select('id')
        .eq('nome', inspetorName)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar inspetor:', error);
      return null;
    }
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
          tipoMaterial: projeto?.tipo_material || 'Material',
          operador: projeto?.operador || 'Operador',
          turno: projeto?.turno || '1',
          aprovadorQA: projeto?.aprovador_qa || 'QA',
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
