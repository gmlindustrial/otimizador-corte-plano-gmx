import type {
  LinearBar,
  LinearBarPiece,
  LinearOptimizationResult,
  LinearEmendaInfo
} from '@/types/linear';

interface Piece {
  id?: string;
  length: number;
  tag?: string;
  fase?: string;
  perfil?: string;
  peso?: number;
  posicao?: string;
  perfilId?: string;
  originalIndex: number;
}

// Re-exportar Bar como alias para LinearBar para compatibilidade
type Bar = LinearBar;

export class BestFitOptimizer {
  private cutLoss: number;
  
  constructor(cutLoss: number = 3) {
    this.cutLoss = cutLoss;
  }

  /**
   * Otimização Best-Fit Decreasing com análise de múltiplas estratégias
   * Agora com suporte a emendas através do EmendaOptimizer
   */
  async optimize(pieces: Piece[], barLength: number, leftovers: any[] = [], emendaConfig?: any): Promise<{
    bars: Bar[];
    efficiency: number;
    totalWaste: number;
    strategy: string;
    pecasComEmenda?: any[];
  }> {
    console.log('=== BestFitOptimizer.optimize ===');
    console.log(`Peças: ${pieces.length}, Barra: ${barLength}mm, Sobras: ${leftovers.length}`);
    console.log(`Emendas habilitadas: ${emendaConfig?.permitirEmendas || emendaConfig?.emendaObrigatoria || false}`);

    // Log dos comprimentos das peças
    const sortedLengths = pieces.map(p => p.length).sort((a, b) => b - a);
    console.log(`Comprimentos (maior→menor): ${sortedLengths.slice(0, 10).join(', ')}${sortedLengths.length > 10 ? '...' : ''}`);
    console.log(`Maior peça: ${sortedLengths[0]}mm, Menor peça: ${sortedLengths[sortedLengths.length - 1]}mm`);
    console.log(`Total de material necessário: ${sortedLengths.reduce((a, b) => a + b, 0)}mm`);

    // Se emendas estão habilitadas
    if (emendaConfig?.permitirEmendas || emendaConfig?.emendaObrigatoria) {
      // Se usar sobras internas está ativado, usar estratégia de emenda interna
      if (emendaConfig?.usarSobrasInternas) {
        console.log('>>> Usando otimização com emendas internas (sobras da própria otimização)');
        return this.optimizeWithInternalSplicing(pieces, barLength, emendaConfig);
      }

      // Caso contrário, usar EmendaOptimizer com sobras do estoque
      console.log('>>> Usando EmendaOptimizer (sobras do estoque)');
      return await this.optimizeWithEmendas(pieces, barLength, leftovers, emendaConfig);
    }

    console.log('>>> Testando múltiplas estratégias...');

    // Testar múltiplas estratégias e escolher a melhor
    const strategies = [
      () => this.bestFitWithLeftoversFirst(pieces, barLength, leftovers),
      () => this.bestFitLargestFirst(pieces, barLength, leftovers),
      () => this.bestFitOptimal(pieces, barLength, leftovers),
      () => this.bestFitWithBackfill(pieces, barLength, leftovers),
    ];

    const strategyNames = ['leftover-first', 'largest-first', 'optimal', 'backfill'];
    let bestResult = null;
    let bestStrategy = '';

    for (let i = 0; i < strategies.length; i++) {
      const result = strategies[i]();
      console.log(`  Estratégia '${strategyNames[i]}': ${result.bars.length} barras, ${result.efficiency.toFixed(1)}% eficiência`);
      if (!bestResult || result.efficiency > bestResult.efficiency) {
        bestResult = result;
        bestStrategy = strategyNames[i];
      }
    }

    console.log(`>>> Melhor estratégia: '${bestStrategy}' com ${bestResult!.bars.length} barras`);

    return { ...bestResult!, strategy: bestStrategy };
  }

  /**
   * Otimização com sistema de emendas
   */
  private async optimizeWithEmendas(pieces: Piece[], barLength: number, leftovers: any[], emendaConfig: any) {
    // Importar e usar EmendaOptimizer apenas quando necessário
    const { EmendaOptimizer } = await import('./EmendaOptimizer');
    
    // Converter peças para o formato esperado pelo EmendaOptimizer
    const optimizationPieces = pieces.map((piece, index) => ({
      id: `piece-${index}`,
      length: piece.length,
      quantity: 1,
      tag: piece.tag,
      posicao: piece.posicao,
      fase: piece.fase,
      perfil: piece.perfil,
      peso: piece.peso,
      perfilId: piece.perfil
    }));

    const emendaOptimizer = new EmendaOptimizer(emendaConfig, leftovers, barLength);
    const emendaResult = await emendaOptimizer.processPieces(optimizationPieces);

    // Processar peças normais com algoritmo tradicional
    const normalPieces = emendaResult.pecasNormais.map(p => ({
      length: p.length,
      tag: p.tag,
      fase: p.fase,
      perfil: p.perfil,
      peso: p.peso,
      posicao: p.posicao,
      originalIndex: 0
    }));

    const normalResult = this.bestFitWithLeftoversFirst(normalPieces, barLength, leftovers);

    // Converter peças com emenda para barras especiais
    // CORRIGIDO: Calcular waste corretamente considerando material real usado nos segmentos
    const emendasBars: Bar[] = emendaResult.pecasComEmenda.map((peca, index) => {
      // Calcular material total consumido pelos segmentos
      const materialTotalSegmentos = peca.segmentos.reduce((sum, s) => sum + s.comprimento, 0);
      // Perda de corte nas emendas (entre cada par de segmentos)
      const cutLossEmendas = peca.emendas.length * this.cutLoss;
      // Material efetivamente utilizado
      const materialUtilizado = peca.comprimentoOriginal + cutLossEmendas;
      // Desperdicio = material consumido - material utilizado
      const wasteEmenda = Math.max(0, materialTotalSegmentos - materialUtilizado);

      return {
        id: `emenda-${index}`,
        type: 'new' as const,
        originalLength: materialTotalSegmentos, // Comprimento real de material consumido
        pieces: [{
          id: peca.id,
          length: peca.comprimentoOriginal,
          tag: peca.tag || `Emenda-${index}`,
          fase: peca.fase,
          perfil: peca.perfil,
          peso: peca.peso,
          posicao: peca.posicao,
          perfilId: peca.perfilId,
          originalIndex: index,
          cortada: false
        }],
        totalUsed: materialUtilizado,
        waste: wasteEmenda,
        score: 100, // Prioridade alta para emendas
        temEmenda: true,
        informacoesEmenda: peca as LinearEmendaInfo
      };
    });

    // Combinar resultados
    const allBars = [...emendasBars, ...normalResult.bars];
    const totalWaste = allBars.reduce((sum, bar) => sum + bar.waste, 0);
    const totalMaterial = allBars.reduce((sum, bar) => sum + bar.originalLength, 0);
    const efficiency = totalMaterial > 0 ? ((totalMaterial - totalWaste) / totalMaterial) * 100 : 0;

    return {
      bars: allBars,
      efficiency,
      totalWaste,
      strategy: 'emendas-enabled',
      pecasComEmenda: emendaResult.pecasComEmenda
    };
  }

  /**
   * Estratégia 1: Priorizar uso de sobras
   */
  private bestFitWithLeftoversFirst(pieces: Piece[], barLength: number, leftovers: any[]) {
    const sortedPieces = [...pieces].sort((a, b) => b.length - a.length);
    const bars: Bar[] = [];
    const remainingPieces = [...sortedPieces];

    // Fase 1: Usar sobras disponíveis
    this.fillLeftoverBars(remainingPieces, leftovers, bars);

    // Fase 2: Usar barras novas com Best-Fit
    this.fillNewBarsWithBestFit(remainingPieces, barLength, bars);

    // Fase 3: Consolidar barras para reduzir desperdício
    this.consolidateBars(bars, barLength);

    return this.calculateResults(bars);
  }

  /**
   * Estratégia 2: Priorizar peças maiores primeiro
   */
  private bestFitLargestFirst(pieces: Piece[], barLength: number, leftovers: any[]) {
    const sortedPieces = [...pieces].sort((a, b) => b.length - a.length);
    const bars: Bar[] = [];

    // Combinar sobras e barras novas em uma única estratégia
    for (const piece of sortedPieces) {
      const bestBar = this.findBestFitBar(piece, bars, barLength, leftovers);

      if (bestBar) {
        this.addPieceToBar(piece, bestBar);
      } else {
        // Tentar criar nova barra (sobra ou nova)
        const newBar = this.createBestBar(piece, barLength, leftovers, bars);
        bars.push(newBar);
      }
    }

    // Consolidar barras para melhor aproveitamento
    this.consolidateBars(bars, barLength);

    return this.calculateResults(bars);
  }

  /**
   * Estratégia 3: Otimização com análise combinatória
   */
  private bestFitOptimal(pieces: Piece[], barLength: number, leftovers: any[]) {
    const groups = this.groupPiecesByLength(pieces);
    const bars: Bar[] = [];

    // Para cada grupo, encontrar a melhor combinação
    for (const group of groups) {
      const combinations = this.findOptimalCombinations(group, barLength);
      
      for (const combo of combinations) {
        const bar = this.createBarFromCombination(combo, barLength, leftovers, bars);
        bars.push(bar);
      }
    }

    return this.calculateResults(bars);
  }

  /**
   * Preencher barras de sobra disponíveis
   */
  private fillLeftoverBars(pieces: Piece[], leftovers: any[], bars: Bar[]) {
    const usedLeftovers = new Set<string>();

    for (let i = pieces.length - 1; i >= 0; i--) {
      const piece = pieces[i];
      
      for (const leftover of leftovers) {
        if (usedLeftovers.has(leftover.id)) continue;
        
        let leftoverBar = bars.find(b => 
          b.type === 'leftover' && b.estoque_id === leftover.id
        );

        if (!leftoverBar) {
          leftoverBar = {
            id: `leftover-${leftover.id}`,
            type: 'leftover',
            originalLength: leftover.comprimento,
            pieces: [],
            totalUsed: 0,
            waste: 0,
            estoque_id: leftover.id,
            score: 0
          };
          bars.push(leftoverBar);
        }

        const spaceNeeded = piece.length + 
          (leftoverBar.pieces.length > 0 ? this.cutLoss : 0);
        const availableSpace = leftover.comprimento - leftoverBar.totalUsed;

        if (availableSpace >= spaceNeeded) {
          this.addPieceToBar(piece, leftoverBar);
          pieces.splice(i, 1);
          usedLeftovers.add(leftover.id);
          break;
        }
      }
    }
  }

  /**
   * Preencher barras novas com algoritmo Best-Fit
   */
  private fillNewBarsWithBestFit(pieces: Piece[], barLength: number, bars: Bar[]) {
    for (const piece of pieces) {
      const bestBar = this.findBestFitNewBar(piece, bars, barLength);
      
      if (bestBar) {
        this.addPieceToBar(piece, bestBar);
      } else {
        const newBar: Bar = {
          id: `new-${bars.filter(b => b.type === 'new').length + 1}`,
          type: 'new',
          originalLength: barLength,
          pieces: [],
          totalUsed: 0,
          waste: 0,
          score: 0
        };
        bars.push(newBar);
        this.addPieceToBar(piece, newBar);
      }
    }
  }

  /**
   * Encontrar a melhor barra para encaixar uma peça
   */
  private findBestFitBar(piece: Piece, bars: Bar[], barLength: number, leftovers: any[]): Bar | null {
    let bestBar: Bar | null = null;
    let bestScore = Infinity;

    // Verificar barras existentes
    for (const bar of bars) {
      const availableSpace = bar.originalLength - bar.totalUsed;
      const spaceNeeded = piece.length + (bar.pieces.length > 0 ? this.cutLoss : 0);
      
      if (availableSpace >= spaceNeeded) {
        // Calcular score: menor desperdício = melhor
        const wasteAfterFit = availableSpace - spaceNeeded;
        if (wasteAfterFit < bestScore) {
          bestScore = wasteAfterFit;
          bestBar = bar;
        }
      }
    }

    return bestBar;
  }

  /**
   * Encontrar melhor barra nova para uma peça
   */
  private findBestFitNewBar(piece: Piece, bars: Bar[], barLength: number): Bar | null {
    let bestBar: Bar | null = null;
    let bestWaste = Infinity;

    for (const bar of bars.filter(b => b.type === 'new')) {
      const availableSpace = barLength - bar.totalUsed;
      const spaceNeeded = piece.length + (bar.pieces.length > 0 ? this.cutLoss : 0);
      
      if (availableSpace >= spaceNeeded) {
        const wasteAfterFit = availableSpace - spaceNeeded;
        if (wasteAfterFit < bestWaste) {
          bestWaste = wasteAfterFit;
          bestBar = bar;
        }
      }
    }

    return bestBar;
  }

  /**
   * Criar a melhor barra possível para uma peça
   */
  private createBestBar(piece: Piece, barLength: number, leftovers: any[], existingBars: Bar[]): Bar {
    // Primeiro tentar sobras disponíveis
    for (const leftover of leftovers) {
      const isUsed = existingBars.some(b => b.estoque_id === leftover.id);
      if (!isUsed && leftover.comprimento >= piece.length) {
        const bar: Bar = {
          id: `leftover-${leftover.id}`,
          type: 'leftover',
          originalLength: leftover.comprimento,
          pieces: [piece],
          totalUsed: piece.length,
          waste: leftover.comprimento - piece.length,
          estoque_id: leftover.id,
          score: 0
        };
        return bar;
      }
    }

    // Se não há sobra adequada, criar barra nova
    return {
      id: `new-${existingBars.filter(b => b.type === 'new').length + 1}`,
      type: 'new',
      originalLength: barLength,
      pieces: [piece],
      totalUsed: piece.length,
      waste: barLength - piece.length,
      score: 0
    };
  }

  /**
   * Agrupar peças por comprimento similar
   */
  private groupPiecesByLength(pieces: Piece[]): Piece[][] {
    const tolerance = 50; // 50mm de tolerância
    const groups: Piece[][] = [];
    const processed = new Set<number>();

    for (let i = 0; i < pieces.length; i++) {
      if (processed.has(i)) continue;
      
      const group = [pieces[i]];
      processed.add(i);

      for (let j = i + 1; j < pieces.length; j++) {
        if (processed.has(j)) continue;
        
        if (Math.abs(pieces[i].length - pieces[j].length) <= tolerance) {
          group.push(pieces[j]);
          processed.add(j);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Encontrar combinações ótimas de peças
   */
  private findOptimalCombinations(pieces: Piece[], barLength: number): Piece[][] {
    if (pieces.length <= 1) return [pieces];

    const combinations: Piece[][] = [];
    const maxCombinations = Math.min(8, Math.pow(2, pieces.length)); // Limitar complexidade

    for (let i = 1; i < maxCombinations; i++) {
      const combo: Piece[] = [];
      let totalLength = 0;

      for (let j = 0; j < pieces.length; j++) {
        if (i & (1 << j)) {
          totalLength += pieces[j].length + (combo.length > 0 ? this.cutLoss : 0);
          if (totalLength <= barLength) {
            combo.push(pieces[j]);
          } else {
            break;
          }
        }
      }

      if (combo.length > 0) {
        combinations.push(combo);
      }
    }

    // Ordenar por eficiência (menos desperdício)
    return combinations.sort((a, b) => {
      const wasteA = barLength - a.reduce((sum, p) => sum + p.length, 0) - (a.length - 1) * this.cutLoss;
      const wasteB = barLength - b.reduce((sum, p) => sum + p.length, 0) - (b.length - 1) * this.cutLoss;
      return wasteA - wasteB;
    });
  }

  /**
   * Criar barra a partir de combinação de peças
   */
  private createBarFromCombination(pieces: Piece[], barLength: number, leftovers: any[], existingBars: Bar[]): Bar {
    const totalLength = pieces.reduce((sum, p) => sum + p.length, 0) + 
                       (pieces.length - 1) * this.cutLoss;

    // Tentar usar sobra adequada
    for (const leftover of leftovers) {
      const isUsed = existingBars.some(b => b.estoque_id === leftover.id);
      if (!isUsed && leftover.comprimento >= totalLength) {
        return {
          id: `leftover-${leftover.id}`,
          type: 'leftover',
          originalLength: leftover.comprimento,
          pieces: [...pieces],
          totalUsed: totalLength,
          waste: leftover.comprimento - totalLength,
          estoque_id: leftover.id,
          score: 0
        };
      }
    }

    // Usar barra nova
    return {
      id: `new-${existingBars.filter(b => b.type === 'new').length + 1}`,
      type: 'new',
      originalLength: barLength,
      pieces: [...pieces],
      totalUsed: totalLength,
      waste: barLength - totalLength,
      score: 0
    };
  }

  /**
   * Adicionar peça a uma barra
   */
  private addPieceToBar(piece: Piece, bar: Bar) {
    const spaceNeeded = piece.length + (bar.pieces.length > 0 ? this.cutLoss : 0);
    bar.pieces.push(piece);
    bar.totalUsed += spaceNeeded;
    bar.waste = bar.originalLength - bar.totalUsed;
  }

  /**
   * Calcular resultados finais
   */
  private calculateResults(bars: Bar[]) {
    const totalWaste = bars.reduce((sum, bar) => sum + bar.waste, 0);
    const totalMaterial = bars.reduce((sum, bar) => sum + bar.originalLength, 0);
    const efficiency = totalMaterial > 0 ? ((totalMaterial - totalWaste) / totalMaterial) * 100 : 0;

    return {
      bars,
      efficiency,
      totalWaste
    };
  }

  /**
   * Backfill: Preencher barras com sobras grandes usando peças menores
   * Esta fase adicional tenta encaixar peças nas sobras existentes
   */
  private backfillBarsWithSmallPieces(bars: Bar[], barLength: number): void {
    // Identificar barras com sobras significativas (> 200mm)
    const barsWithWaste = bars.filter(b => b.waste > 200);

    if (barsWithWaste.length === 0) return;

    console.log(`  Backfill: ${barsWithWaste.length} barras com sobra > 200mm`);

    // Coletar todas as peças de todas as barras para possível realocação
    const allPieces: { piece: Piece; barIndex: number }[] = [];
    bars.forEach((bar, barIndex) => {
      bar.pieces.forEach(piece => {
        allPieces.push({ piece: piece as Piece, barIndex });
      });
    });

    // Ordenar barras por sobra (maior primeiro)
    barsWithWaste.sort((a, b) => b.waste - a.waste);

    // Para cada barra com sobra grande, tentar mover peças de barras menos eficientes
    for (const targetBar of barsWithWaste) {
      // Encontrar barras com poucas peças que poderiam ser consolidadas
      for (const sourceBar of bars) {
        if (sourceBar === targetBar) continue;
        if (sourceBar.pieces.length === 0) continue;

        // Tentar mover peças pequenas da sourceBar para a targetBar
        for (let i = sourceBar.pieces.length - 1; i >= 0; i--) {
          const piece = sourceBar.pieces[i] as Piece;
          const spaceNeeded = piece.length + (targetBar.pieces.length > 0 ? this.cutLoss : 0);

          if (targetBar.waste >= spaceNeeded) {
            // Mover peça
            sourceBar.pieces.splice(i, 1);
            targetBar.pieces.push(piece);

            // Recalcular totais
            sourceBar.totalUsed = this.calculateBarTotalUsed(sourceBar);
            sourceBar.waste = sourceBar.originalLength - sourceBar.totalUsed;
            targetBar.totalUsed = this.calculateBarTotalUsed(targetBar);
            targetBar.waste = targetBar.originalLength - targetBar.totalUsed;
          }
        }
      }
    }

    // Remover barras que ficaram vazias
    for (let i = bars.length - 1; i >= 0; i--) {
      if (bars[i].pieces.length === 0) {
        console.log(`  Backfill: Barra ${bars[i].id} removida (ficou vazia)`);
        bars.splice(i, 1);
      }
    }
  }

  /**
   * Calcular total usado em uma barra considerando cutLoss
   */
  private calculateBarTotalUsed(bar: Bar): number {
    if (bar.pieces.length === 0) return 0;

    let total = 0;
    bar.pieces.forEach((piece, index) => {
      total += (piece as Piece).length;
      if (index > 0) total += this.cutLoss;
    });
    return total;
  }

  /**
   * Estratégia 4: Best-Fit com Backfill - melhor combinação possível
   * Ordena por maior primeiro, depois faz backfill agressivo
   */
  private bestFitWithBackfill(pieces: Piece[], barLength: number, leftovers: any[]) {
    // Ordenar peças por tamanho (maior primeiro)
    const sortedPieces = [...pieces].sort((a, b) => b.length - a.length);
    const bars: Bar[] = [];

    // Fase 1: Alocar peças usando Best-Fit Decreasing
    for (const piece of sortedPieces) {
      let bestBar: Bar | null = null;
      let bestWaste = Infinity;

      // Procurar melhor barra existente
      for (const bar of bars) {
        const available = bar.originalLength - bar.totalUsed;
        const needed = piece.length + (bar.pieces.length > 0 ? this.cutLoss : 0);

        if (available >= needed) {
          const wasteAfter = available - needed;
          if (wasteAfter < bestWaste) {
            bestWaste = wasteAfter;
            bestBar = bar;
          }
        }
      }

      if (bestBar) {
        this.addPieceToBar(piece, bestBar);
      } else {
        // Criar nova barra
        const newBar: Bar = {
          id: `new-${bars.length + 1}`,
          type: 'new',
          originalLength: barLength,
          pieces: [piece],
          totalUsed: piece.length,
          waste: barLength - piece.length,
          score: 0
        };
        bars.push(newBar);
      }
    }

    // Fase 2: Backfill - consolidar barras com poucas peças
    this.consolidateBars(bars, barLength);

    // Fase 3: Backfill adicional para preencher sobras
    this.backfillBarsWithSmallPieces(bars, barLength);

    return this.calculateResults(bars);
  }

  /**
   * Consolidar barras: mover peças de barras pouco utilizadas para barras mais cheias
   */
  private consolidateBars(bars: Bar[], barLength: number): void {
    // Ordenar barras por eficiência (menos eficiente primeiro)
    const barsByEfficiency = [...bars].sort((a, b) => {
      const effA = a.totalUsed / a.originalLength;
      const effB = b.totalUsed / b.originalLength;
      return effA - effB;
    });

    // Tentar mover peças de barras pouco eficientes para barras mais eficientes
    for (const sourceBar of barsByEfficiency) {
      if (sourceBar.pieces.length === 0) continue;

      // Se a barra tem menos de 60% de eficiência, tentar consolidar
      const efficiency = sourceBar.totalUsed / sourceBar.originalLength;
      if (efficiency > 0.6) continue;

      // Tentar mover cada peça para outra barra
      for (let i = sourceBar.pieces.length - 1; i >= 0; i--) {
        const piece = sourceBar.pieces[i] as Piece;

        // Procurar melhor destino
        let bestTarget: Bar | null = null;
        let bestWaste = Infinity;

        for (const targetBar of bars) {
          if (targetBar === sourceBar) continue;
          if (targetBar.pieces.length === 0) continue;

          const available = targetBar.originalLength - targetBar.totalUsed;
          const needed = piece.length + this.cutLoss;

          if (available >= needed) {
            const wasteAfter = available - needed;
            if (wasteAfter < bestWaste) {
              bestWaste = wasteAfter;
              bestTarget = targetBar;
            }
          }
        }

        if (bestTarget) {
          // Mover peça
          sourceBar.pieces.splice(i, 1);
          bestTarget.pieces.push(piece);

          // Recalcular totais
          sourceBar.totalUsed = this.calculateBarTotalUsed(sourceBar);
          sourceBar.waste = sourceBar.originalLength - sourceBar.totalUsed;
          bestTarget.totalUsed = this.calculateBarTotalUsed(bestTarget);
          bestTarget.waste = bestTarget.originalLength - bestTarget.totalUsed;
        }
      }
    }

    // Remover barras vazias
    for (let i = bars.length - 1; i >= 0; i--) {
      if (bars[i].pieces.length === 0) {
        bars.splice(i, 1);
      }
    }
  }

  /**
   * Otimização com emendas internas - usa sobras geradas na própria otimização
   * Esta estratégia rastreia sobras de cada barra e as usa para emendar outras peças
   */
  private optimizeWithInternalSplicing(
    pieces: Piece[],
    barLength: number,
    emendaConfig: any
  ): {
    bars: Bar[];
    efficiency: number;
    totalWaste: number;
    strategy: string;
    pecasComEmenda?: any[];
  } {
    console.log('=== Otimização com Emendas Internas ===');

    const sortedPieces = [...pieces].sort((a, b) => b.length - a.length);
    const bars: Bar[] = [];
    const pecasComEmenda: any[] = [];
    const tamanhoMinimoSobra = emendaConfig.tamanhoMinimoSobra || 200;

    // Rastrear sobras internas disponíveis com nomes
    interface SobraInterna {
      comprimento: number;
      barraOrigem: string;
      barraIndex: number;
      nome: string;  // Nome amigável: "Sobra 1", "Sobra 2", etc.
    }
    const sobrasInternas: SobraInterna[] = [];
    let contadorSobra = 0;  // Contador para nomear sobras

    console.log(`Peças a processar: ${sortedPieces.length}`);
    console.log(`Tamanho mínimo de sobra para emenda: ${tamanhoMinimoSobra}mm`);

    for (const piece of sortedPieces) {
      // 1. Tentar encaixar em barra existente com espaço
      let placed = false;
      let bestBar: Bar | null = null;
      let bestWaste = Infinity;

      for (const bar of bars) {
        const available = bar.originalLength - bar.totalUsed;
        const needed = piece.length + (bar.pieces.length > 0 ? this.cutLoss : 0);

        if (available >= needed) {
          const wasteAfter = available - needed;
          if (wasteAfter < bestWaste) {
            bestWaste = wasteAfter;
            bestBar = bar;
          }
        }
      }

      if (bestBar) {
        this.addPieceToBar(piece, bestBar);

        const sobraAtual = bestBar.waste;
        const sobraUtilizavel = sobraAtual >= tamanhoMinimoSobra;

        // Atualizar informações da sobra na barra
        (bestBar as any).sobraComprimento = sobraAtual;
        (bestBar as any).sobraUtilizavel = sobraUtilizavel;

        // Atualizar lista de sobras internas (apenas utilizáveis)
        const sobraIndex = sobrasInternas.findIndex(s => s.barraOrigem === bestBar!.id);

        if (sobraIndex > -1) {
          // Barra já tinha sobra registrada
          if (sobraUtilizavel) {
            // Apenas atualizar comprimento
            sobrasInternas[sobraIndex].comprimento = sobraAtual;
          } else {
            // Remover da lista de sobras utilizáveis
            sobrasInternas.splice(sobraIndex, 1);
            console.log(`  ⚠️ ${(bestBar as any).geraSobra} agora não utilizável (${sobraAtual}mm < ${tamanhoMinimoSobra}mm)`);
          }
        } else if (sobraUtilizavel && !(bestBar as any).geraSobra) {
          // Barra agora é utilizável mas não tinha sobra registrada - criar nova
          const novoNome = `Sobra ${++contadorSobra}`;
          (bestBar as any).geraSobra = novoNome;
          sobrasInternas.push({
            comprimento: sobraAtual,
            barraOrigem: bestBar.id,
            barraIndex: bars.indexOf(bestBar),
            nome: novoNome
          });
          console.log(`  📦 ${novoNome} registrada: ${sobraAtual}mm ✅ utilizável (Barra existente ${bestBar.id})`);
        }

        placed = true;
        continue;
      }

      // 2. Tentar fazer emenda com sobras internas
      if (sobrasInternas.length > 0) {
        const emendaResult = this.tentarEmendaInterna(
          piece,
          sobrasInternas,
          barLength,
          tamanhoMinimoSobra,
          bars
        );

        if (emendaResult) {
          pecasComEmenda.push(emendaResult.pecaComEmenda);
          bars.push(emendaResult.novaBarra);

          // Adicionar informações de sobra à barra de emenda
          const wasteEmenda = emendaResult.novaBarra.waste;
          const sobraUtilizavelEmenda = wasteEmenda >= tamanhoMinimoSobra;

          // Só nomear e registrar sobras que atingem o tamanho mínimo para emendas
          (emendaResult.novaBarra as any).sobraComprimento = wasteEmenda;
          (emendaResult.novaBarra as any).sobraUtilizavel = sobraUtilizavelEmenda;

          if (sobraUtilizavelEmenda) {
            const novaSobraNome = `Sobra ${++contadorSobra}`;
            (emendaResult.novaBarra as any).geraSobra = novaSobraNome;

            // Registrar na lista de sobras internas
            sobrasInternas.push({
              comprimento: wasteEmenda,
              barraOrigem: emendaResult.novaBarra.id,
              barraIndex: bars.length - 1,
              nome: novaSobraNome
            });
            console.log(`  📦 ${novaSobraNome}: ${wasteEmenda}mm ✅ utilizável`);
          } else {
            (emendaResult.novaBarra as any).geraSobra = undefined;
          }

          console.log(`  ✂️ Emenda criada para peça ${piece.tag || piece.length}mm usando ${emendaResult.sobraNome} (${emendaResult.sobraUsada}mm)`);
          placed = true;
          continue;
        }
      }

      // 3. Criar nova barra
      const wasteNovaBarra = barLength - piece.length;
      const sobraUtilizavel = wasteNovaBarra >= tamanhoMinimoSobra;
      // Só nomear e registrar sobras que atingem o tamanho mínimo para emendas
      const sobraNome = sobraUtilizavel ? `Sobra ${++contadorSobra}` : undefined;

      const newBar: Bar = {
        id: `new-${bars.length + 1}`,
        type: 'new',
        originalLength: barLength,
        pieces: [piece],
        totalUsed: piece.length,
        waste: wasteNovaBarra,
        score: 0,
        geraSobra: sobraNome,  // Nome da sobra gerada por esta barra
        sobraComprimento: wasteNovaBarra,  // Tamanho da sobra em mm
        sobraUtilizavel: sobraUtilizavel   // Se pode ser usada para emendas
      };
      bars.push(newBar);

      // Registrar sobra interna APENAS se utilizável para emendas
      if (sobraUtilizavel && sobraNome) {
        sobrasInternas.push({
          comprimento: wasteNovaBarra,
          barraOrigem: newBar.id,
          barraIndex: bars.length - 1,
          nome: sobraNome
        });
        console.log(`  📦 ${sobraNome} registrada: ${wasteNovaBarra}mm ✅ utilizável (Barra ${newBar.id})`);
      }
    }

    // Consolidar barras no final
    this.consolidateBars(bars, barLength);

    // Calcular resultados
    const totalWaste = bars.reduce((sum, bar) => sum + bar.waste, 0);
    const totalMaterial = bars.reduce((sum, bar) => sum + bar.originalLength, 0);
    const efficiency = totalMaterial > 0 ? ((totalMaterial - totalWaste) / totalMaterial) * 100 : 0;

    console.log(`=== Resultado Emendas Internas ===`);
    console.log(`Barras: ${bars.length}, Eficiência: ${efficiency.toFixed(1)}%`);
    console.log(`Peças com emenda: ${pecasComEmenda.length}`);

    return {
      bars,
      efficiency,
      totalWaste,
      strategy: 'internal-splicing',
      pecasComEmenda
    };
  }

  /**
   * Tentar criar emenda usando sobras internas disponíveis
   */
  private tentarEmendaInterna(
    piece: Piece,
    sobrasInternas: Array<{ comprimento: number; barraOrigem: string; barraIndex: number; nome: string }>,
    barLength: number,
    tamanhoMinimoSobra: number,
    bars: Bar[]
  ): { pecaComEmenda: any; novaBarra: Bar; sobraUsada: number; sobraNome: string } | null {

    // Ordenar sobras por tamanho (maior primeiro) para melhor aproveitamento
    const sobrasOrdenadas = [...sobrasInternas].sort((a, b) => b.comprimento - a.comprimento);

    for (let i = 0; i < sobrasOrdenadas.length; i++) {
      const sobra = sobrasOrdenadas[i];

      // Verificar se sobra + parte de nova barra >= peça
      // Exemplo: peça=4000, sobra=2500, nova barra pode fornecer até 6000
      // Precisamos: 4000 - 2500 = 1500mm de nova barra

      const comprimentoNecessarioDaNovaBarra = piece.length - sobra.comprimento + this.cutLoss;

      // Se o comprimento necessário cabe em uma nova barra
      if (comprimentoNecessarioDaNovaBarra > 0 && comprimentoNecessarioDaNovaBarra <= barLength) {
        // Criar emenda: sobra + parte de barra nova

        const pecaComEmenda = {
          id: piece.id || `piece-${Date.now()}`,
          comprimentoOriginal: piece.length,
          tag: piece.tag,
          posicao: piece.posicao,
          fase: piece.fase,
          perfil: piece.perfil,
          peso: piece.peso,
          perfilId: piece.perfilId,
          quantidade: 1,
          segmentos: [
            {
              comprimento: sobra.comprimento,
              origemTipo: 'sobra' as const,
              origemId: sobra.barraOrigem,
              perfilId: piece.perfilId || '',
              posicaoNaBarra: 0
            },
            {
              comprimento: piece.length - sobra.comprimento,
              origemTipo: 'nova_barra' as const,
              origemId: `new-splice-${Date.now()}`,
              perfilId: piece.perfilId || '',
              posicaoNaBarra: sobra.comprimento
            }
          ],
          emendas: [{
            posicao: sobra.comprimento,
            qualidadeAfetada: false,
            inspecaoObrigatoria: false
          }],
          statusQualidade: 'pendente' as const,
          temEmenda: true,
          observacoes: `Usa ${sobra.nome} (${sobra.comprimento}mm)`
        };

        // Criar barra que representa APENAS o material novo usado
        const novaBarra: Bar = {
          id: `splice-${bars.length + 1}`,
          type: 'new',
          originalLength: barLength,
          pieces: [{
            ...piece,
            // Mostrar apenas o comprimento que vem desta barra na visualização
            length: comprimentoNecessarioDaNovaBarra,
            // Guardar informações da peça original para referência
            pecaOriginal: {
              comprimentoTotal: piece.length,
              tag: piece.tag,
              posicao: piece.posicao,
            },
            originalIndex: 0
          }],
          totalUsed: comprimentoNecessarioDaNovaBarra,
          waste: barLength - comprimentoNecessarioDaNovaBarra,
          score: 100,
          temEmenda: true,
          sobraUsada: sobra.nome,
          // Detalhes completos da emenda para visualização separada
          emendaDetalhes: {
            pecaTag: piece.tag,
            pecaPosicao: piece.posicao,
            comprimentoTotal: piece.length,
            sobraNome: sobra.nome,
            sobraComprimento: sobra.comprimento,
            barraOrigemSobra: sobra.barraOrigem,
            comprimentoNovaBarra: comprimentoNecessarioDaNovaBarra,
          }
        };

        // Remover sobra usada da lista
        const originalIndex = sobrasInternas.findIndex(s => s.barraOrigem === sobra.barraOrigem);
        if (originalIndex > -1) {
          sobrasInternas.splice(originalIndex, 1);
        }

        // Atualizar a barra original para refletir que a sobra foi usada
        const barraOriginal = bars.find(b => b.id === sobra.barraOrigem);
        if (barraOriginal) {
          // Sobra foi completamente incorporada à peça emendada
          (barraOriginal as any).sobraUsadaPor = novaBarra.id;  // Marcar quem usou
          (barraOriginal as any).sobraUtilizavel = false;  // Não mais disponível
          // Manter waste original e geraSobra para histórico/display
        }

        return {
          pecaComEmenda,
          novaBarra,
          sobraUsada: sobra.comprimento,
          sobraNome: sobra.nome
        };
      }
    }

    return null;
  }
}