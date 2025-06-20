
import { supabase } from '@/integrations/supabase/client';
import type { SheetCutPiece, SheetOptimizationResult, SheetProject } from '@/types/sheet';

export interface SheetOptimizationHistory {
  id: string;
  project_id: string;
  project_name: string;
  pieces: SheetCutPiece[];
  results: SheetOptimizationResult;
  algorithm: string;
  optimization_time: number;
  created_at: string;
  efficiency: number;
  total_sheets: number;
  total_weight: number;
  material_cost: number;
}

export class SheetHistoryService {
  // Salvar otimização no histórico
  async saveOptimization(
    project: SheetProject,
    pieces: SheetCutPiece[],
    results: SheetOptimizationResult,
    algorithm: string = 'MultiObjective',
    optimizationTime: number = 0
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('sheet_optimization_history')
        .insert({
          project_id: project.id,
          project_name: project.name,
          pieces: pieces as any,
          results: results as any,
          algorithm: algorithm,
          optimization_time: optimizationTime,
          efficiency: results.averageEfficiency,
          total_sheets: results.totalSheets,
          total_weight: results.totalWeight,
          material_cost: results.materialCost
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar histórico de otimização:', error);
        return null;
      }

      console.log('Histórico de otimização salvo:', data.id);
      return data.id;
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
      return null;
    }
  }

  // Recuperar histórico por projeto
  async getProjectHistory(projectId: string): Promise<SheetOptimizationHistory[]> {
    try {
      const { data, error } = await supabase
        .from('sheet_optimization_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao recuperar histórico do projeto:', error);
        return [];
      }

      return (data as any[])?.map(item => ({
        ...item,
        pieces: item.pieces as SheetCutPiece[],
        results: item.results as SheetOptimizationResult
      })) || [];
    } catch (error) {
      console.error('Erro ao recuperar histórico:', error);
      return [];
    }
  }

  // Recuperar todo o histórico (com paginação)
  async getAllHistory(limit: number = 50, offset: number = 0): Promise<{
    data: SheetOptimizationHistory[];
    total: number;
  }> {
    try {
      // Contar total de registros
      const { count } = await supabase
        .from('sheet_optimization_history')
        .select('*', { count: 'exact', head: true });

      // Recuperar dados paginados
      const { data, error } = await supabase
        .from('sheet_optimization_history')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Erro ao recuperar histórico geral:', error);
        return { data: [], total: 0 };
      }

      const transformedData = (data as any[])?.map(item => ({
        ...item,
        pieces: item.pieces as SheetCutPiece[],
        results: item.results as SheetOptimizationResult
      })) || [];

      return {
        data: transformedData,
        total: count || 0
      };
    } catch (error) {
      console.error('Erro ao recuperar histórico:', error);
      return { data: [], total: 0 };
    }
  }

  // Buscar histórico por filtros
  async searchHistory(filters: {
    projectName?: string;
    algorithm?: string;
    minEfficiency?: number;
    maxSheets?: number;
    dateRange?: { start: string; end: string };
  }): Promise<SheetOptimizationHistory[]> {
    try {
      let query = supabase
        .from('sheet_optimization_history')
        .select('*');

      if (filters.projectName) {
        query = query.ilike('project_name', `%${filters.projectName}%`);
      }

      if (filters.algorithm) {
        query = query.eq('algorithm', filters.algorithm);
      }

      if (filters.minEfficiency) {
        query = query.gte('efficiency', filters.minEfficiency);
      }

      if (filters.maxSheets) {
        query = query.lte('total_sheets', filters.maxSheets);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }

      return (data as any[])?.map(item => ({
        ...item,
        pieces: item.pieces as SheetCutPiece[],
        results: item.results as SheetOptimizationResult
      })) || [];
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  }

  // Calcular estatísticas do histórico
  async getHistoryStatistics(): Promise<{
    totalOptimizations: number;
    averageEfficiency: number;
    totalSheetsUsed: number;
    totalWeight: number;
    totalCost: number;
    algorithmUsage: { [key: string]: number };
    efficiencyTrend: Array<{ date: string; efficiency: number; }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('sheet_optimization_history')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data) {
        console.error('Erro ao calcular estatísticas:', error);
        return {
          totalOptimizations: 0,
          averageEfficiency: 0,
          totalSheetsUsed: 0,
          totalWeight: 0,
          totalCost: 0,
          algorithmUsage: {},
          efficiencyTrend: []
        };
      }

      const totalOptimizations = data.length;
      const averageEfficiency = data.reduce((sum, item) => sum + item.efficiency, 0) / totalOptimizations;
      const totalSheetsUsed = data.reduce((sum, item) => sum + item.total_sheets, 0);
      const totalWeight = data.reduce((sum, item) => sum + item.total_weight, 0);
      const totalCost = data.reduce((sum, item) => sum + item.material_cost, 0);

      // Uso por algoritmo
      const algorithmUsage: { [key: string]: number } = {};
      data.forEach(item => {
        algorithmUsage[item.algorithm] = (algorithmUsage[item.algorithm] || 0) + 1;
      });

      // Tendência de eficiência (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentData = data.filter(item => 
        new Date(item.created_at) >= thirtyDaysAgo
      );

      const efficiencyTrend = recentData.map(item => ({
        date: new Date(item.created_at).toISOString().split('T')[0],
        efficiency: item.efficiency
      }));

      return {
        totalOptimizations,
        averageEfficiency,
        totalSheetsUsed,
        totalWeight,
        totalCost,
        algorithmUsage,
        efficiencyTrend
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        totalOptimizations: 0,
        averageEfficiency: 0,
        totalSheetsUsed: 0,
        totalWeight: 0,
        totalCost: 0,
        algorithmUsage: {},
        efficiencyTrend: []
      };
    }
  }

  // Deletar otimização do histórico
  async deleteOptimization(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sheet_optimization_history')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar otimização:', error);
        return false;
      }

      console.log('Otimização deletada:', id);
      return true;
    } catch (error) {
      console.error('Erro ao deletar otimização:', error);
      return false;
    }
  }

  // Exportar histórico para CSV
  async exportToCSV(): Promise<string> {
    try {
      const { data } = await this.getAllHistory(1000); // Exportar até 1000 registros

      const headers = [
        'ID',
        'Projeto',
        'Algoritmo',
        'Data',
        'Eficiência (%)',
        'Chapas',
        'Peso (kg)',
        'Custo (R$)',
        'Tempo Otim. (ms)'
      ];

      const csvData = data.map(item => [
        item.id,
        item.project_name,
        item.algorithm,
        new Date(item.created_at).toLocaleDateString('pt-BR'),
        item.efficiency.toFixed(2),
        item.total_sheets,
        item.total_weight.toFixed(2),
        item.material_cost.toFixed(2),
        item.optimization_time
      ]);

      const csv = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csv;
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      return '';
    }
  }

  // Comparar duas otimizações
  async compareOptimizations(id1: string, id2: string): Promise<{
    optimization1: SheetOptimizationHistory | null;
    optimization2: SheetOptimizationHistory | null;
    comparison: any;
  }> {
    try {
      const { data, error } = await supabase
        .from('sheet_optimization_history')
        .select('*')
        .in('id', [id1, id2]);

      if (error || !data || data.length !== 2) {
        return {
          optimization1: null,
          optimization2: null,
          comparison: null
        };
      }

      const opt1Data = data.find(item => item.id === id1);
      const opt2Data = data.find(item => item.id === id2);

      const opt1: SheetOptimizationHistory | null = opt1Data ? {
        ...opt1Data,
        pieces: opt1Data.pieces as SheetCutPiece[],
        results: opt1Data.results as SheetOptimizationResult
      } : null;

      const opt2: SheetOptimizationHistory | null = opt2Data ? {
        ...opt2Data,
        pieces: opt2Data.pieces as SheetCutPiece[],
        results: opt2Data.results as SheetOptimizationResult
      } : null;

      const comparison = {
        efficiency: {
          opt1: opt1?.efficiency || 0,
          opt2: opt2?.efficiency || 0,
          difference: (opt2?.efficiency || 0) - (opt1?.efficiency || 0)
        },
        sheets: {
          opt1: opt1?.total_sheets || 0,
          opt2: opt2?.total_sheets || 0,
          difference: (opt2?.total_sheets || 0) - (opt1?.total_sheets || 0)
        },
        weight: {
          opt1: opt1?.total_weight || 0,
          opt2: opt2?.total_weight || 0,
          difference: (opt2?.total_weight || 0) - (opt1?.total_weight || 0)
        },
        cost: {
          opt1: opt1?.material_cost || 0,
          opt2: opt2?.material_cost || 0,
          difference: (opt2?.material_cost || 0) - (opt1?.material_cost || 0)
        }
      };

      return {
        optimization1: opt1,
        optimization2: opt2,
        comparison
      };
    } catch (error) {
      console.error('Erro ao comparar otimizações:', error);
      return {
        optimization1: null,
        optimization2: null,
        comparison: null
      };
    }
  }
}

// Instância singleton do serviço
export const sheetHistoryService = new SheetHistoryService();
