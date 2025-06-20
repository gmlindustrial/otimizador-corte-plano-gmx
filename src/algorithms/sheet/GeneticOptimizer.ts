
import type { SheetCutPiece, SheetPlacedPiece, SheetOptimizationResult } from '@/types/sheet';
import { BottomLeftFillOptimizer } from './BottomLeftFill';

interface Individual {
  pieces: SheetCutPiece[];
  fitness: number;
  efficiency: number;
  wasteReduction: number;
}

interface GeneticConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  eliteSize: number;
}

export class GeneticOptimizer {
  private sheetWidth: number;
  private sheetHeight: number;
  private kerf: number;
  private thickness: number;
  private material: string;
  private config: GeneticConfig;

  constructor(
    sheetWidth: number, 
    sheetHeight: number, 
    kerf: number = 2, 
    thickness: number = 6, 
    material: string = 'A36'
  ) {
    this.sheetWidth = sheetWidth;
    this.sheetHeight = sheetHeight;
    this.kerf = kerf;
    this.thickness = thickness;
    this.material = material;
    this.config = {
      populationSize: 50,
      generations: 100,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      eliteSize: 5
    };
  }

  optimize(pieces: SheetCutPiece[]): SheetOptimizationResult {
    console.log('Iniciando otimização genética para', pieces.length, 'tipos de peças');
    
    // Expandir peças considerando quantidade
    const expandedPieces = this.expandPieces(pieces);
    
    // Criar população inicial
    let population = this.createInitialPopulation(expandedPieces);
    
    // Avaliar população inicial
    population = this.evaluatePopulation(population);
    
    let bestSolution = population[0];
    let generationsWithoutImprovement = 0;
    
    for (let generation = 0; generation < this.config.generations; generation++) {
      // Seleção, crossover e mutação
      const newPopulation = this.evolvePopulation(population);
      
      // Avaliar nova população
      population = this.evaluatePopulation(newPopulation);
      
      // Verificar se houve melhoria
      if (population[0].fitness > bestSolution.fitness) {
        bestSolution = population[0];
        generationsWithoutImprovement = 0;
        console.log(`Geração ${generation}: Nova melhor solução com fitness ${bestSolution.fitness.toFixed(3)}`);
      } else {
        generationsWithoutImprovement++;
      }
      
      // Parada antecipada se não houver melhoria por muitas gerações
      if (generationsWithoutImprovement > 20) {
        console.log(`Parada antecipada na geração ${generation} - sem melhoria por 20 gerações`);
        break;
      }
    }
    
    // Usar BottomLeftFill no melhor indivíduo encontrado
    const blf = new BottomLeftFillOptimizer(this.sheetWidth, this.sheetHeight, this.kerf, this.thickness, this.material);
    return blf.optimize(bestSolution.pieces);
  }

  private expandPieces(pieces: SheetCutPiece[]): SheetCutPiece[] {
    const expanded: SheetCutPiece[] = [];
    pieces.forEach((piece, index) => {
      for (let i = 0; i < piece.quantity; i++) {
        expanded.push({
          ...piece,
          id: `${piece.id}_${i}`,
          quantity: 1
        });
      }
    });
    return expanded;
  }

  private createInitialPopulation(pieces: SheetCutPiece[]): Individual[] {
    const population: Individual[] = [];
    
    for (let i = 0; i < this.config.populationSize; i++) {
      const shuffledPieces = [...pieces];
      
      // Diferentes estratégias de ordenação inicial
      if (i % 4 === 0) {
        // Por área decrescente
        shuffledPieces.sort((a, b) => (b.width * b.height) - (a.width * a.height));
      } else if (i % 4 === 1) {
        // Por largura decrescente
        shuffledPieces.sort((a, b) => b.width - a.width);
      } else if (i % 4 === 2) {
        // Por altura decrescente
        shuffledPieces.sort((a, b) => b.height - a.height);
      } else {
        // Aleatório
        this.shuffleArray(shuffledPieces);
      }
      
      // Aplicar rotações aleatórias em algumas peças
      shuffledPieces.forEach(piece => {
        if (piece.allowRotation && Math.random() < 0.3) {
          [piece.width, piece.height] = [piece.height, piece.width];
        }
      });
      
      population.push({
        pieces: shuffledPieces,
        fitness: 0,
        efficiency: 0,
        wasteReduction: 0
      });
    }
    
    return population;
  }

  private evaluatePopulation(population: Individual[]): Individual[] {
    population.forEach(individual => {
      const blf = new BottomLeftFillOptimizer(this.sheetWidth, this.sheetHeight, this.kerf, this.thickness, this.material);
      const result = blf.optimize(individual.pieces);
      
      // Fitness multi-objetivo: eficiência + redução de desperdício + número de chapas
      const efficiency = result.averageEfficiency / 100;
      const wasteReduction = 1 - (result.totalWasteArea / (result.totalSheets * this.sheetWidth * this.sheetHeight));
      const sheetPenalty = 1 / (result.totalSheets + 1); // Penalizar muitas chapas
      
      individual.efficiency = efficiency;
      individual.wasteReduction = wasteReduction;
      individual.fitness = (efficiency * 0.5) + (wasteReduction * 0.3) + (sheetPenalty * 0.2);
    });
    
    // Ordenar por fitness decrescente
    population.sort((a, b) => b.fitness - a.fitness);
    return population;
  }

  private evolvePopulation(population: Individual[]): Individual[] {
    const newPopulation: Individual[] = [];
    
    // Elitismo: manter os melhores
    for (let i = 0; i < this.config.eliteSize; i++) {
      newPopulation.push({ ...population[i] });
    }
    
    // Gerar resto da população
    while (newPopulation.length < this.config.populationSize) {
      // Seleção por torneio
      const parent1 = this.tournamentSelection(population);
      const parent2 = this.tournamentSelection(population);
      
      // Crossover
      let offspring1, offspring2;
      if (Math.random() < this.config.crossoverRate) {
        [offspring1, offspring2] = this.crossover(parent1, parent2);
      } else {
        offspring1 = { ...parent1 };
        offspring2 = { ...parent2 };
      }
      
      // Mutação
      if (Math.random() < this.config.mutationRate) {
        this.mutate(offspring1);
      }
      if (Math.random() < this.config.mutationRate) {
        this.mutate(offspring2);
      }
      
      newPopulation.push(offspring1);
      if (newPopulation.length < this.config.populationSize) {
        newPopulation.push(offspring2);
      }
    }
    
    return newPopulation;
  }

  private tournamentSelection(population: Individual[]): Individual {
    const tournamentSize = 3;
    const tournament: Individual[] = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }
    
    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
  }

  private crossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    const length = parent1.pieces.length;
    const crossoverPoint = Math.floor(Math.random() * length);
    
    const offspring1Pieces = [
      ...parent1.pieces.slice(0, crossoverPoint),
      ...parent2.pieces.slice(crossoverPoint)
    ];
    
    const offspring2Pieces = [
      ...parent2.pieces.slice(0, crossoverPoint),
      ...parent1.pieces.slice(crossoverPoint)
    ];
    
    return [
      { pieces: offspring1Pieces, fitness: 0, efficiency: 0, wasteReduction: 0 },
      { pieces: offspring2Pieces, fitness: 0, efficiency: 0, wasteReduction: 0 }
    ];
  }

  private mutate(individual: Individual): void {
    const pieces = individual.pieces;
    
    // Tipo de mutação aleatória
    const mutationType = Math.random();
    
    if (mutationType < 0.4) {
      // Trocar posições de duas peças
      const i = Math.floor(Math.random() * pieces.length);
      const j = Math.floor(Math.random() * pieces.length);
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    } else if (mutationType < 0.7) {
      // Rotacionar peça aleatória (se permitido)
      const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
      if (randomPiece.allowRotation) {
        [randomPiece.width, randomPiece.height] = [randomPiece.height, randomPiece.width];
      }
    } else {
      // Embaralhar segmento pequeno
      const start = Math.floor(Math.random() * pieces.length);
      const end = Math.min(start + 5, pieces.length);
      const segment = pieces.slice(start, end);
      this.shuffleArray(segment);
      pieces.splice(start, segment.length, ...segment);
    }
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
