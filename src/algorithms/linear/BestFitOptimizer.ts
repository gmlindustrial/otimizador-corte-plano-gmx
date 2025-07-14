interface Piece {
  length: number;
  tag?: string;
  conjunto?: string;
  perfil?: string;
  peso?: number;
  posicao?: string;
  originalIndex: number;
}

interface Bar {
  id: string;
  type: 'new' | 'leftover';
  originalLength: number;
  pieces: Piece[];
  totalUsed: number;
  waste: number;
  estoque_id?: string;
  score: number; // Para ordenação por qualidade do encaixe
}

export class BestFitOptimizer {
  private cutLoss: number;
  
  constructor(cutLoss: number = 3) {
    this.cutLoss = cutLoss;
  }

  /**
   * Otimização Best-Fit Decreasing com análise de múltiplas estratégias
   */
  optimize(pieces: Piece[], barLength: number, leftovers: any[] = []): {
    bars: Bar[];
    efficiency: number;
    totalWaste: number;
    strategy: string;
  } {
    // Testar múltiplas estratégias e escolher a melhor
    const strategies = [
      () => this.bestFitWithLeftoversFirst(pieces, barLength, leftovers),
      () => this.bestFitLargestFirst(pieces, barLength, leftovers),
      () => this.bestFitOptimal(pieces, barLength, leftovers),
    ];

    let bestResult = null;
    let bestStrategy = '';

    for (let i = 0; i < strategies.length; i++) {
      const result = strategies[i]();
      if (!bestResult || result.efficiency > bestResult.efficiency) {
        bestResult = result;
        bestStrategy = ['leftover-first', 'largest-first', 'optimal'][i];
      }
    }

    return { ...bestResult!, strategy: bestStrategy };
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
}