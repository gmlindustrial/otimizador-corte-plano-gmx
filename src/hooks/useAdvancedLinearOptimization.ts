import { useState } from 'react';
import type { Project, CutPiece, OptimizationResult } from '@/pages/Index';
import { BestFitOptimizer } from '@/algorithms/linear/BestFitOptimizer';
import { BundleOptimizer } from '@/algorithms/linear/BundleOptimizer';
import { MultiLengthOptimizer } from '@/algorithms/linear/MultiLengthOptimizer';
import { PreAnalyzer } from '@/algorithms/linear/PreAnalyzer';
import { useEstoqueSobras } from '@/hooks/useEstoqueSobras';
import { usePerfilService } from '@/hooks/services/usePerfilService';
import { StockVerificationService } from '@/services/StockVerificationService';
import { toast } from 'sonner';
import type { BundleOptimizationResult } from '@/types/bundle';

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
      fase?: string;
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
  const [bundleResults, setBundleResults] = useState<BundleOptimizationResult | null>(null);

  const { sobras, usarSobra, adicionarSobra } = useEstoqueSobras();
  const { perfis } = usePerfilService();

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
   * @param bundleEnabled - Se true, usa BundleOptimizer para agrupar por perfil
   * @param availableBarLengths - Se fornecido com >1 tamanho, usa MultiLengthOptimizer (G8)
   */
  const runAdvancedOptimization = async (bundleEnabled: boolean = false, availableBarLengths?: number[]) => {
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

      // G13: Verificação de estoque real
      const estimatedBars = StockVerificationService.estimateBarsNeeded(pieces, barLength);
      const materialId = (project as any)?.tipoMaterial;
      if (materialId) {
        const stockCheck = await StockVerificationService.verifyStock(materialId, estimatedBars);
        if (!stockCheck.isAvailable && stockCheck.deficit > 0) {
          toast.warning(
            `Estoque insuficiente: necessário ${stockCheck.barsNeeded} barras, ` +
            `disponível ${stockCheck.barsInStock}. Faltam ${stockCheck.deficit} barras.`
          );
        }
      }

      // Preparar peças para otimização (preservando identidade de bundle)
      const expandedPieces = [];
      pieces.forEach((piece, index) => {
        const bundleId = piece.quantity > 1 ? `bundle-${piece.id || index}` : undefined;
        for (let i = 0; i < piece.quantity; i++) {
          expandedPieces.push({
            length: piece.length,
            tag: (piece as any).tag || `P${index + 1}`,
            fase: (piece as any).fase,
            perfil: (piece as any).perfil,
            peso: (piece as any).peso,
            posicao: (piece as any).posicao,
            originalIndex: index,
            bundleId,
            bundleSequence: bundleId ? i + 1 : undefined,
            bundleTotal: bundleId ? piece.quantity : undefined,
          });
        }
      });

      // Safeguard de performance
      if (expandedPieces.length > 3000) {
        toast.warning(`Otimização grande (${expandedPieces.length} peças) — usando algoritmo simplificado para melhor desempenho`);
      }

      // Ler configurações de corte do localStorage
      const savedConfig = typeof window !== 'undefined'
        ? localStorage.getItem('barCuttingConfig')
        : null;
      const barConfig = savedConfig ? JSON.parse(savedConfig) : {};
      const cutLoss = barConfig.cutLoss ?? 3;

      // === OTIMIZAÇÃO POR AMARRADO ===
      if (bundleEnabled) {
        console.log('=== MODO AMARRADO ATIVADO ===');

        // Construir profileLookup a partir dos perfis do banco
        const profileLookup = new Map<string, { maxBarsPerBundle: number; description: string; type: string; kgPerMeter: number }>();
        for (const perfil of perfis) {
          profileLookup.set(perfil.id, {
            maxBarsPerBundle: perfil.max_barras_amarrado ?? 1,
            description: perfil.descricao_perfil,
            type: perfil.tipo_perfil,
            kgPerMeter: perfil.kg_por_metro,
          });
        }

        // Converter CutPiece[] para LinearInputPiece[]
        const inputPieces = pieces.map(p => ({
          id: p.id,
          length: p.length,
          quantity: p.quantity,
          tag: (p as any).tag,
          posicao: (p as any).posicao,
          fase: (p as any).fase,
          perfil: (p as any).perfil,
          peso: (p as any).peso,
          perfilId: (p as any).perfilId,
        }));

        const bundleKerfFactor = barConfig.bundleKerfFactor ?? 1.2;

        const bundleOptimizer = new BundleOptimizer({
          barLength,
          cutLoss,
          kerfFactor: bundleKerfFactor,
          costPerBar: 50,
          setupTimePerCut: 2.5,
        });

        const bundleResult = await bundleOptimizer.optimize(inputPieces, profileLookup);
        setBundleResults(bundleResult);

        // Converter bundle results para formato compatível com a UI existente
        const allBars = [
          ...bundleResult.bundles.flatMap(b => {
            // Cada amarrado gera bundleSize barras idênticas, mas mostramos 1 com badge ×N
            return [{
              id: b.bundleId,
              pieces: b.pattern.pieces.map((p, idx) => ({
                length: p.length,
                color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][idx % 5],
                label: p.tag || `${p.length}mm`,
                tag: p.tag,
                fase: p.fase,
                perfil: p.profileDescription,
                peso: p.peso,
                posicao: p.posicao,
              })),
              waste: b.pattern.wastePerBar,
              totalUsed: b.pattern.totalUsed,
              // Metadados extras para visualização de amarrado
              _bundleSize: b.bundleSize,
              _bundleId: b.bundleId,
              _profileDescription: b.profileDescription,
            }];
          }),
          ...bundleResult.individualBars.map(bar => ({
            id: bar.id,
            pieces: bar.pieces.map((p, idx) => ({
              length: p.length,
              color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][idx % 5],
              label: p.tag || `${p.length}mm`,
              tag: p.tag,
              fase: p.fase,
              perfil: p.perfil,
              peso: p.peso,
              posicao: p.posicao,
            })),
            waste: bar.waste,
            totalUsed: bar.totalUsed,
          })),
        ];

        const result: AdvancedOptimizationResult = {
          bars: allBars,
          totalBars: bundleResult.summary.totalBars,
          totalWaste: bundleResult.summary.totalWaste,
          wastePercentage: 100 - bundleResult.summary.averageEfficiency,
          efficiency: bundleResult.summary.averageEfficiency,
          cuttableBars: allBars.map(bar => ({
            id: bar.id,
            type: 'new' as const,
            pieces: bar.pieces,
            waste: bar.waste,
            totalUsed: bar.totalUsed,
            originalLength: barLength,
          })),
          sustainability: {
            leftoverBarsUsed: 0,
            newBarsUsed: bundleResult.summary.totalBars,
            materialReused: 0,
            totalEconomy: bundleResult.summary.totalCostSaving,
            wasteReduction: 0,
            autoRegisteredWastes: 0,
          },
          strategy: 'bundle',
          preAnalysis: analysis,
        };

        // Fase 4: Registrar sobras do amarrado ×N no estoque
        let autoRegisteredBundleWastes = 0;
        for (const bundle of bundleResult.bundles) {
          if (bundle.pattern.wastePerBar > 100) {
            try {
              // Cada barra do amarrado gera a mesma sobra
              await adicionarSobra(
                Math.floor(bundle.pattern.wastePerBar),
                bundle.bundleSize // ×N: quantidade = bundleSize
              );
              autoRegisteredBundleWastes += bundle.bundleSize;
            } catch (error) {
              console.error('Erro ao cadastrar sobras do amarrado:', error);
            }
          }
        }
        // Sobras de barras individuais
        for (const bar of bundleResult.individualBars) {
          if (bar.waste > 100) {
            try {
              await adicionarSobra(Math.floor(bar.waste), 1);
              autoRegisteredBundleWastes++;
            } catch (error) {
              console.error('Erro ao cadastrar sobra individual:', error);
            }
          }
        }

        result.sustainability.autoRegisteredWastes = autoRegisteredBundleWastes;
        setResults(result);

        toast.success(
          `Otimização por amarrado concluída! ` +
          `${bundleResult.summary.totalBundles} amarrado(s), ` +
          `${bundleResult.individualBars.length} barra(s) individual(is), ` +
          `${bundleResult.summary.averageEfficiency.toFixed(1)}% eficiência` +
          (autoRegisteredBundleWastes > 0 ? `, ${autoRegisteredBundleWastes} sobra(s) cadastrada(s)` : '')
        );

        return result;
      }

      // === OTIMIZAÇÃO INDIVIDUAL (padrão) ===
      // G8: Se múltiplos tamanhos disponíveis, usar MultiLengthOptimizer
      let optimizationResult;
      if (availableBarLengths && availableBarLengths.length > 1) {
        console.log('=== MODO MULTI-COMPRIMENTO (G8) ===');
        const multiOptimizer = new MultiLengthOptimizer(cutLoss);
        const multiResult = await multiOptimizer.optimize(expandedPieces, availableBarLengths, sobras);
        optimizationResult = multiResult;
        console.log(`Melhor tamanho: ${multiResult.bestBarLength}mm`);
        console.log('Comparação:', multiResult.comparison.map(c => `${c.barLength}mm: ${c.efficiency.toFixed(1)}%`).join(', '));
      } else {
        const optimizer = new BestFitOptimizer(cutLoss);
        optimizationResult = await optimizer.optimize(expandedPieces, barLength, sobras);
      }

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
          fase: piece.fase,
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
            fase: piece.fase,
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
    bundleResults,

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