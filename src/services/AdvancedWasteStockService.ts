import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WasteEntry {
  comprimento: number;
  quantidade: number;
  projeto_origem?: string;
  data_origem?: string;
  qualidade?: 'excelente' | 'boa' | 'regular';
  observacoes?: string;
}

interface OptimizationBar {
  id: string;
  type: 'new' | 'leftover';
  waste: number;
  totalUsed: number;
  originalLength: number;
  pieces: any[];
}

export class AdvancedWasteStockService {
  /**
   * Cadastrar sobras automaticamente após otimização
   */
  static async registerOptimizationWastes(
    bars: OptimizationBar[],
    projectInfo?: { projectNumber?: string; client?: string }
  ): Promise<number> {
    try {
      console.log('=== CADASTRANDO SOBRAS AUTOMATICAMENTE ===');
      
      // Filtrar sobras significativas (> 100mm)
      const significantWastes = bars
        .filter(bar => bar.waste > 100)
        .map(bar => this.createWasteEntry(bar, projectInfo));

      console.log('Sobras para cadastrar:', significantWastes.length);

      if (significantWastes.length === 0) {
        console.log('Nenhuma sobra significativa encontrada');
        return 0;
      }

      // Inserir sobras no banco
      const { data, error } = await supabase
        .from('estoque_sobras')
        .insert(significantWastes)
        .select();

      if (error) {
        console.error('Erro ao cadastrar sobras:', error);
        throw error;
      }

      console.log('Sobras cadastradas:', data?.length || 0);
      
      toast.success(
        `${significantWastes.length} sobra(s) cadastrada(s) automaticamente no estoque`,
        { duration: 4000 }
      );

      return significantWastes.length;
    } catch (error) {
      console.error('Erro no cadastro automático de sobras:', error);
      toast.error('Erro ao cadastrar sobras automaticamente');
      return 0;
    }
  }

  /**
   * Criar entrada de sobra a partir de uma barra otimizada
   */
  private static createWasteEntry(
    bar: OptimizationBar,
    projectInfo?: { projectNumber?: string; client?: string }
  ): WasteEntry {
    // Calcular qualidade da sobra baseada no tamanho
    let qualidade: 'excelente' | 'boa' | 'regular' = 'regular';
    if (bar.waste > 1000) qualidade = 'excelente';
    else if (bar.waste > 500) qualidade = 'boa';

    // Gerar observações úteis
    const observacoes = [
      `Sobra de otimização - ${bar.pieces.length} peça(s) cortada(s)`,
      bar.type === 'leftover' ? 'Sobra de sobra reutilizada' : 'Material novo',
      `Eficiência da barra: ${((bar.totalUsed / bar.originalLength) * 100).toFixed(1)}%`
    ].join(' | ');

    return {
      comprimento: Math.floor(bar.waste),
      quantidade: 1,
      projeto_origem: projectInfo?.projectNumber || 'Otimização Automática',
      data_origem: new Date().toISOString().split('T')[0],
      qualidade,
      observacoes: observacoes.substring(0, 200) // Limitar tamanho
    };
  }

  /**
   * Validar qualidade das sobras antes do uso
   */
  static async validateLeftoverQuality(leftoverId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('estoque_sobras')
        .select('*')
        .eq('id', leftoverId)
        .single();

      if (error || !data) {
        console.warn('Sobra não encontrada:', leftoverId);
        return false;
      }

      // Verificar critérios de qualidade
      const isValidLength = data.comprimento >= 200; // Mínimo 200mm
      const hasQuantity = data.quantidade > 0;
      
      // Verificar idade (opcional - sobras muito antigas podem ter problemas)
      const createdDate = new Date(data.created_at);
      const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      const isRecentEnough = daysSinceCreated <= 365; // Máximo 1 ano

      return isValidLength && hasQuantity && isRecentEnough;
    } catch (error) {
      console.error('Erro na validação de qualidade da sobra:', error);
      return false;
    }
  }

  /**
   * Otimizar uso de sobras com priorização FIFO
   */
  static async getOptimizedLeftoverList(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('estoque_sobras')
        .select('*')
        .gte('comprimento', 200) // Apenas sobras úteis
        .gt('quantidade', 0)
        .order('created_at', { ascending: true }); // FIFO - mais antigas primeiro

      if (error) {
        console.error('Erro ao buscar sobras otimizadas:', error);
        return [];
      }

      // Validar qualidade e filtrar sobras ruins
      const validLeftovers = [];
      for (const leftover of data || []) {
        const isValid = await this.validateLeftoverQuality(leftover.id);
        if (isValid) {
          validLeftovers.push({
            ...leftover,
            // Adicionar score de prioridade
            priority: this.calculateLeftoverPriority(leftover)
          });
        }
      }

      // Ordenar por prioridade (FIFO + tamanho otimizado)
      return validLeftovers.sort((a, b) => b.priority - a.priority);
    } catch (error) {
      console.error('Erro ao otimizar lista de sobras:', error);
      return [];
    }
  }

  /**
   * Calcular prioridade de uso da sobra
   */
  private static calculateLeftoverPriority(leftover: any): number {
    let score = 0;

    // Prioridade por idade (FIFO)
    const daysSinceCreated = (Date.now() - new Date(leftover.created_at).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.min(daysSinceCreated, 100); // Máximo 100 pontos por idade

    // Prioridade por tamanho (sobras médias são mais versáteis)
    if (leftover.comprimento >= 1000 && leftover.comprimento <= 3000) {
      score += 50; // Tamanho ideal
    } else if (leftover.comprimento > 3000) {
      score += 30; // Grandes são boas mas menos versáteis
    } else {
      score += 10; // Pequenas são menos úteis
    }

    // Prioridade por quantidade (usar sobras únicas primeiro)
    if (leftover.quantidade === 1) {
      score += 20;
    }

    return score;
  }

  /**
   * Rastreamento de uso de sobras
   */
  static async trackLeftoverUsage(
    leftoverId: string,
    quantityUsed: number,
    projectInfo?: { projectNumber?: string; pieces?: number }
  ): Promise<void> {
    try {
      // Registrar o uso (poderia ser uma tabela separada para histórico)
      console.log(`Sobra ${leftoverId} utilizada: ${quantityUsed} unidade(s) no projeto ${projectInfo?.projectNumber || 'N/A'}`);
      
      // Aqui poderia ser implementada uma tabela de histórico de uso de sobras
      // Por enquanto, apenas logamos para acompanhamento
      
      toast.info(
        `Sobra ${leftoverId.substring(0, 8)}... utilizada com sucesso`,
        { duration: 2000 }
      );
    } catch (error) {
      console.error('Erro ao rastrear uso de sobra:', error);
    }
  }

  /**
   * Relatório de sustentabilidade
   */
  static async generateSustainabilityReport(optimizationId?: string): Promise<{
    totalLeftoversUsed: number;
    totalMaterialSaved: number;
    totalCostSaved: number;
    wasteReductionPercentage: number;
  }> {
    try {
      // Buscar dados de otimizações recentes
      const { data: optimizations, error } = await supabase
        .from('historico_otimizacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      let totalLeftoversUsed = 0;
      let totalMaterialSaved = 0;
      let totalCostSaved = 0;

      // Analisar cada otimização
      optimizations?.forEach(opt => {
        const results = opt.resultados as any;
        if (results?.sustainability) {
          totalLeftoversUsed += results.sustainability.leftoverBarsUsed || 0;
          totalMaterialSaved += results.sustainability.materialReused || 0;
          totalCostSaved += results.sustainability.totalEconomy || 0;
        }
      });

      // Calcular redução de desperdício
      const totalMaterial = optimizations?.reduce((sum, opt) => {
        const results = opt.resultados as any;
        return sum + (results?.bars?.reduce((barSum: number, bar: any) => 
          barSum + (bar.originalLength || opt.bar_length), 0) || 0);
      }, 0) || 1;

      const wasteReductionPercentage = (totalMaterialSaved / totalMaterial) * 100;

      return {
        totalLeftoversUsed,
        totalMaterialSaved: totalMaterialSaved / 1000, // Converter para metros
        totalCostSaved,
        wasteReductionPercentage
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de sustentabilidade:', error);
      return {
        totalLeftoversUsed: 0,
        totalMaterialSaved: 0,
        totalCostSaved: 0,
        wasteReductionPercentage: 0
      };
    }
  }
}