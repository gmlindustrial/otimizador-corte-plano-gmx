interface AnalysisPiece {
  length: number;
  quantity: number;
  tag?: string;
  conjunto?: string;
}

interface AnalysisResult {
  viability: 'viable' | 'challenging' | 'impossible';
  estimatedBars: number;
  estimatedEfficiency: number;
  recommendations: string[];
  pieceDistribution: {
    small: number;    // < 1000mm
    medium: number;   // 1000-3000mm
    large: number;    // > 3000mm
  };
  challenges: string[];
  suggestions: string[];
}

export class PreAnalyzer {
  private barLength: number;
  private cutLoss: number;

  constructor(barLength: number, cutLoss: number = 3) {
    this.barLength = barLength;
    this.cutLoss = cutLoss;
  }

  /**
   * Análise prévia completa das peças e condições de otimização
   */
  analyze(pieces: AnalysisPiece[], leftovers: any[] = []): AnalysisResult {
    const analysis = {
      viability: 'viable' as const,
      estimatedBars: 0,
      estimatedEfficiency: 0,
      recommendations: [] as string[],
      pieceDistribution: { small: 0, medium: 0, large: 0 },
      challenges: [] as string[],
      suggestions: [] as string[]
    };

    // Expandir peças com quantidades
    const expandedPieces = this.expandPieces(pieces);
    
    // Análise de viabilidade básica
    this.checkViability(expandedPieces, analysis);
    
    // Análise de distribuição de tamanhos
    this.analyzePieceDistribution(expandedPieces, analysis);
    
    // Estimativa de barras necessárias
    this.estimateBarUsage(expandedPieces, leftovers, analysis);
    
    // Estimativa de eficiência
    this.estimateEfficiency(expandedPieces, analysis);
    
    // Identificar desafios
    this.identifyChallenges(expandedPieces, leftovers, analysis);
    
    // Gerar recomendações
    this.generateRecommendations(expandedPieces, leftovers, analysis);

    return analysis;
  }

  /**
   * Expandir peças considerando quantidades
   */
  private expandPieces(pieces: AnalysisPiece[]): number[] {
    const expanded: number[] = [];
    pieces.forEach(piece => {
      for (let i = 0; i < piece.quantity; i++) {
        expanded.push(piece.length);
      }
    });
    return expanded.sort((a, b) => b - a);
  }

  /**
   * Verificar viabilidade básica
   */
  private checkViability(pieces: number[], analysis: AnalysisResult) {
    const impossiblePieces = pieces.filter(p => p > this.barLength);
    
    if (impossiblePieces.length > 0) {
      analysis.viability = 'impossible';
      analysis.challenges.push(
        `${impossiblePieces.length} peça(s) excedem o comprimento da barra (${this.barLength}mm)`
      );
      return;
    }

    const challengingPieces = pieces.filter(p => p > this.barLength * 0.8);
    if (challengingPieces.length > pieces.length * 0.3) {
      analysis.viability = 'challenging';
      analysis.challenges.push(
        `${challengingPieces.length} peça(s) são muito grandes (>80% da barra), o que pode gerar muito desperdício`
      );
    }
  }

  /**
   * Analisar distribuição de tamanhos das peças
   */
  private analyzePieceDistribution(pieces: number[], analysis: AnalysisResult) {
    pieces.forEach(length => {
      if (length < 1000) {
        analysis.pieceDistribution.small++;
      } else if (length <= 3000) {
        analysis.pieceDistribution.medium++;
      } else {
        analysis.pieceDistribution.large++;
      }
    });

    // Adicionar insights sobre a distribuição
    const total = pieces.length;
    const largePercent = (analysis.pieceDistribution.large / total) * 100;
    const smallPercent = (analysis.pieceDistribution.small / total) * 100;

    if (largePercent > 50) {
      analysis.challenges.push('Muitas peças grandes podem reduzir a eficiência');
      analysis.suggestions.push('Considere agrupar peças pequenas nas sobras das grandes');
    }

    if (smallPercent > 60) {
      analysis.suggestions.push('Muitas peças pequenas permitem boa otimização de encaixe');
    }
  }

  /**
   * Estimar número de barras necessárias
   */
  private estimateBarUsage(pieces: number[], leftovers: any[], analysis: AnalysisResult) {
    // Cálculo básico: área total / área útil por barra
    const totalLength = pieces.reduce((sum, p) => sum + p, 0);
    const cutsNeeded = pieces.length - 1; // Cortes entre peças
    const totalLengthWithCuts = totalLength + (cutsNeeded * this.cutLoss);
    
    // Considerar sobras disponíveis
    const leftoverLength = leftovers.reduce((sum, l) => sum + l.comprimento * l.quantidade, 0);
    const usableLeftoverLength = leftoverLength * 0.8; // Assumir 80% de utilização das sobras
    
    const remainingLength = Math.max(0, totalLengthWithCuts - usableLeftoverLength);
    const newBarsNeeded = Math.ceil(remainingLength / (this.barLength * 0.85)); // 85% de eficiência esperada
    
    analysis.estimatedBars = newBarsNeeded + Math.ceil(leftovers.length * 0.6); // 60% das sobras usadas
  }

  /**
   * Estimar eficiência da otimização
   */
  private estimateEfficiency(pieces: number[], analysis: AnalysisResult) {
    const totalUsefulLength = pieces.reduce((sum, p) => sum + p, 0);
    const totalAvailableLength = analysis.estimatedBars * this.barLength;
    
    if (totalAvailableLength > 0) {
      analysis.estimatedEfficiency = (totalUsefulLength / totalAvailableLength) * 100;
    }

    // Ajustar baseado na distribuição de tamanhos
    const largePercent = (analysis.pieceDistribution.large / pieces.length) * 100;
    if (largePercent > 40) {
      analysis.estimatedEfficiency *= 0.9; // Reduzir 10% para peças grandes
    }

    // Ajustar para perdas de corte
    analysis.estimatedEfficiency *= 0.95; // 5% de perda estimada por cortes
  }

  /**
   * Identificar desafios potenciais
   */
  private identifyChallenges(pieces: number[], leftovers: any[], analysis: AnalysisResult) {
    // Verificar variedade de tamanhos
    const uniqueLengths = new Set(pieces).size;
    if (uniqueLengths < pieces.length * 0.3) {
      analysis.suggestions.push('Peças com tamanhos similares permitem melhor otimização');
    }

    // Verificar disponibilidade de sobras
    if (leftovers.length === 0) {
      analysis.challenges.push('Sem sobras disponíveis - maior consumo de material novo');
      analysis.suggestions.push('Considere verificar o estoque de sobras antes da otimização');
    }

    // Verificar peças muito pequenas
    const verySmallPieces = pieces.filter(p => p < 200).length;
    if (verySmallPieces > 0) {
      analysis.challenges.push(`${verySmallPieces} peça(s) muito pequena(s) (<200mm) podem ser difíceis de otimizar`);
    }

    // Verificar sequência de cortes
    const avgPieceLength = pieces.reduce((sum, p) => sum + p, 0) / pieces.length;
    if (avgPieceLength > this.barLength * 0.6) {
      analysis.challenges.push('Peças grandes em média podem resultar em muitas sobras pequenas');
    }
  }

  /**
   * Gerar recomendações específicas
   */
  private generateRecommendations(pieces: number[], leftovers: any[], analysis: AnalysisResult) {
    // Recomendação de estratégia baseada na análise
    if (analysis.pieceDistribution.large > analysis.pieceDistribution.small) {
      analysis.recommendations.push('Estratégia recomendada: Priorizar peças grandes primeiro');
    } else {
      analysis.recommendations.push('Estratégia recomendada: Usar sobras primeiro para peças pequenas');
    }

    // Recomendações de eficiência
    if (analysis.estimatedEfficiency < 70) {
      analysis.recommendations.push('Eficiência baixa esperada - considere revisar dimensões das peças');
    }

    if (leftovers.length > 0) {
      analysis.recommendations.push(`${leftovers.length} sobra(s) disponível(eis) - priorizar uso sustentável`);
    }

    // Recomendações operacionais
    if (pieces.length > 50) {
      analysis.recommendations.push('Muitas peças - considere dividir em lotes menores para facilitar o controle');
    }

    if (analysis.estimatedBars > 20) {
      analysis.recommendations.push('Projeto grande - considere planejar a sequência de corte com antecedência');
    }

    // Recomendação de qualidade
    const complexityScore = this.calculateComplexityScore(pieces);
    if (complexityScore > 0.7) {
      analysis.recommendations.push('Alta complexidade detectada - revisar cuidadosamente antes de executar');
    }
  }

  /**
   * Calcular score de complexidade do projeto
   */
  private calculateComplexityScore(pieces: number[]): number {
    const factors = {
      quantity: Math.min(pieces.length / 100, 1), // Normalizar quantidade
      variety: new Set(pieces).size / pieces.length, // Variedade de tamanhos
      largeRatio: pieces.filter(p => p > this.barLength * 0.7).length / pieces.length, // Proporção de peças grandes
      avgSize: (pieces.reduce((sum, p) => sum + p, 0) / pieces.length) / this.barLength // Tamanho médio normalizado
    };

    return (factors.quantity + factors.variety + factors.largeRatio + factors.avgSize) / 4;
  }
}