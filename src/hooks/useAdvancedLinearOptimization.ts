import { useState } from 'react';
import type { Project, CutPiece, OptimizationResult } from '@/pages/Index';
import { BestFitOptimizer } from '@/algorithms/linear/BestFitOptimizer';
import { PreAnalyzer } from '@/algorithms/linear/PreAnalyzer';
import { useEstoqueSobras } from '@/hooks/useEstoqueSobras';
import { toast } from 'sonner';

// Interface para resultados de análise prévia
interface PreAnalysisResult {
  viability: 'viable' | 'challenging' | 'impossible';
  estimatedBars: number;
  estimatedEfficiency: number;
  recommendations: string[];
  pieceDistribution: {
    small: number;
    medium: number;
    large: number;
  };
  challenges: string[];
  suggestions: string[];
}

// Interface para resultados avançados
interface AdvancedOptimizationResult extends OptimizationResult {
  // Apenas barras que precisam ser cortadas (não mostra sobras)
  cuttableBars: Array<{
    id: string;
    type: 'new' | 'leftover';
    pieces: Array<{
      length: number;
      color: string;
      label: string;
      tag?: string;
      conjunto?: string;
      perfil?: string;
      peso?: number;
      posicao?: string;
    }>;
    waste: number;
    totalUsed: number;
    originalLength: number;
    estoque_id?: string;
  }>;
  sustainability: {
    leftoverBarsUsed: number;
    newBarsUsed: number;
    materialReused: number;
    totalEconomy: number;
    wasteReduction: number;
    autoRegisteredWastes: number;
  };
  strategy: string;
  preAnalysis: PreAnalysisResult;
}

export const useAdvancedLinearOptimization = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [barLength, setBarLength] = useState(6000);
  const [pieces, setPieces] = useState<CutPiece[]>([]);
  const [results, setResults] = useState<AdvancedOptimizationResult | null>(null);
  const [preAnalysis, setPreAnalysis] = useState<PreAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const { sobras, usarSobra, adicionarSobra } = useEstoqueSobras();

  /**
   * Executar análise prévia das peças
   */
  const runPreAnalysis = async () => {
    if (pieces.length === 0) {
      toast.error('Adicione peças antes de fazer a análise');
      return null;
    }

    setIsAnalyzing(true);
    
    try {
      const analyzer = new PreAnalyzer(barLength);
      const analysis = analyzer.analyze(pieces, sobras);
      
      setPreAnalysis(analysis);
      
      // Mostrar toast com resumo da análise
      if (analysis.viability === 'impossible') {
        toast.error('Projeto inviável: peças excedem o comprimento da barra');
      } else if (analysis.viability === 'challenging') {
        toast.warning(`Projeto desafiador: ${analysis.estimatedBars} barras, ${analysis.estimatedEfficiency.toFixed(1)}% eficiência estimada`);
      } else {
        toast.success(`Análise concluída: ${analysis.estimatedBars} barras estimadas, ${analysis.estimatedEfficiency.toFixed(1)}% eficiência`);
      }

      return analysis;
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Executar otimização avançada
   */
  const runAdvancedOptimization = async () => {
    if (pieces.length === 0) {
      toast.error('Adicione peças antes de otimizar');
      return null;
    }

    // Executar análise prévia se não foi feita
    let analysis = preAnalysis;
    if (!analysis) {
      analysis = await runPreAnalysis();
      if (!analysis) return null;
    }

    if (analysis.viability === 'impossible') {
      toast.error('Não é possível otimizar: projeto inviável');
      return null;
    }

    setIsOptimizing(true);

    try {
      console.log('=== INICIANDO OTIMIZAÇÃO AVANÇADA ===');
      console.log('Projeto:', project);
      console.log('Peças:', pieces.length);
      console.log('Sobras disponíveis:', sobras.length);

      // Preparar peças para otimização
      const expandedPieces = [];
      pieces.forEach((piece, index) => {
        for (let i = 0; i < piece.quantity; i++) {
          expandedPieces.push({
            length: piece.length,
            tag: (piece as any).tag || `P${index + 1}`,
            conjunto: (piece as any).conjunto,
            perfil: (piece as any).perfil,
            peso: (piece as any).peso,
            posicao: (piece as any).posicao,
            originalIndex: index
          });
        }
      });

      // Executar otimização com algoritmo avançado
      const optimizer = new BestFitOptimizer();
      const optimizationResult = optimizer.optimize(expandedPieces, barLength, sobras);

      console.log('Estratégia utilizada:', optimizationResult.strategy);
      console.log('Barras geradas:', optimizationResult.bars.length);

      // Filtrar barras vazias e que precisam ser cortadas
      const validBars = optimizationResult.bars.filter(bar => bar.pieces.length > 0);
      const cuttableBars = validBars.filter(bar => 
        bar.pieces.length > 1 || bar.pieces[0]?.length < bar.originalLength - 100
      );

      console.log('Barras para corte:', cuttableBars.length);

      // Calcular métricas de sustentabilidade
      const leftoverBarsUsed = optimizationResult.bars.filter(b => b.type === 'leftover').length;
      const newBarsUsed = optimizationResult.bars.filter(b => b.type === 'new').length;
      const materialReused = optimizationResult.bars
        .filter(b => b.type === 'leftover')
        .reduce((sum, b) => sum + b.totalUsed, 0);
      
      const totalEconomy = materialReused * 0.008; // R$ 8,00/metro
      const totalMaterial = optimizationResult.bars.reduce((sum, b) => sum + b.originalLength, 0);
      const wasteReduction = materialReused > 0 ? (materialReused / totalMaterial) * 100 : 0;

      // Atualizar estoque de sobras usadas
      const usageCount: Record<string, number> = {};
      optimizationResult.bars.forEach(bar => {
        if (bar.type === 'leftover' && bar.estoque_id) {
          usageCount[bar.estoque_id] = (usageCount[bar.estoque_id] || 0) + 1;
        }
      });

      // Aplicar uso das sobras no estoque
      Object.entries(usageCount).forEach(([id, qty]) => {
        usarSobra(id, qty);
      });

      // Cadastrar automaticamente sobras > 100mm no estoque
      let autoRegisteredWastes = 0;
      for (const bar of optimizationResult.bars) {
        if (bar.waste > 100) {
          try {
            await adicionarSobra(Math.floor(bar.waste), 1);
            autoRegisteredWastes++;
          } catch (error) {
            console.error('Erro ao cadastrar sobra automaticamente:', error);
          }
        }
      }

      console.log('Sobras cadastradas automaticamente:', autoRegisteredWastes);

      // Converter para formato de resultado compatível (apenas barras válidas)
      const standardBars = validBars.map(bar => ({
        id: bar.id,
        pieces: bar.pieces.map(piece => ({
          length: piece.length,
          color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][piece.originalIndex % 5],
          label: piece.tag || `${piece.length}mm`,
          tag: piece.tag,
          conjunto: piece.conjunto,
          perfil: piece.perfil,
          peso: piece.peso,
          posicao: piece.posicao
        })),
        waste: bar.waste,
        totalUsed: bar.totalUsed
      }));

      const result: AdvancedOptimizationResult = {
        // Resultado padrão para compatibilidade
        bars: standardBars,
        totalBars: validBars.length,
        totalWaste: optimizationResult.totalWaste,
        wastePercentage: 100 - optimizationResult.efficiency,
        efficiency: optimizationResult.efficiency,

        // Barras filtradas (apenas as que precisam ser cortadas)
        cuttableBars: cuttableBars.map(bar => ({
          id: bar.id,
          type: bar.type,
          pieces: bar.pieces.map(piece => ({
            length: piece.length,
            color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][piece.originalIndex % 5],
            label: piece.tag || `${piece.length}mm`,
            tag: piece.tag,
            conjunto: piece.conjunto,
            perfil: piece.perfil,
            peso: piece.peso,
            posicao: piece.posicao
          })),
          waste: bar.waste,
          totalUsed: bar.totalUsed,
          originalLength: bar.originalLength,
          estoque_id: bar.estoque_id
        })),

        // Métricas avançadas
        sustainability: {
          leftoverBarsUsed,
          newBarsUsed,
          materialReused,
          totalEconomy,
          wasteReduction,
          autoRegisteredWastes
        },
        
        strategy: optimizationResult.strategy,
        preAnalysis: analysis
      };

      setResults(result);

      // Toast com resumo dos resultados
      toast.success(
        `Otimização concluída! ${cuttableBars.length} barra(s) para corte, ` +
        `${leftoverBarsUsed} sobra(s) reutilizada(s), ` +
        `${autoRegisteredWastes} nova(s) sobra(s) cadastrada(s)`
      );

      console.log('=== OTIMIZAÇÃO CONCLUÍDA ===');
      console.log('Eficiência final:', result.efficiency.toFixed(1), '%');
      console.log('Estratégia aplicada:', result.strategy);

      return result;
    } catch (error) {
      console.error('Erro na otimização avançada:', error);
      toast.error('Erro durante a otimização');
      return null;
    } finally {
      setIsOptimizing(false);
    }
  };

  return {
    // Estado
    project,
    setProject,
    barLength,
    setBarLength,
    pieces,
    setPieces,
    results,
    setResults,
    preAnalysis,
    
    // Flags de carregamento
    isAnalyzing,
    isOptimizing,
    
    // Métodos
    runPreAnalysis,
    runAdvancedOptimization,
    
    // Compatibilidade com interface antiga
    handleOptimize: runAdvancedOptimization
  };
};