
import type { SheetPlacedPiece } from '@/types/sheet';

interface CutPoint {
  x: number;
  y: number;
  piece: SheetPlacedPiece;
  type: 'entry' | 'start' | 'end';
}

interface CutPath {
  points: CutPoint[];
  totalDistance: number;
  piercePoints: number;
}

export class SequenceOptimizer {
  private kerf: number;
  private process: 'plasma' | 'oxicorte' | 'both';

  constructor(kerf: number = 2, process: 'plasma' | 'oxicorte' | 'both' = 'plasma') {
    this.kerf = kerf;
    this.process = process;
  }

  // Otimizar sequência de corte para minimizar movimentos da máquina
  optimizeCuttingSequence(pieces: SheetPlacedPiece[]): CutPath {
    console.log('Otimizando sequência de corte para', pieces.length, 'peças');
    
    // Calcular pontos de entrada para cada peça
    const cutPoints = this.calculateCutPoints(pieces);
    
    // Aplicar algoritmo do vizinho mais próximo modificado
    const optimizedPath = this.nearestNeighborTSP(cutPoints);
    
    // Calcular distância total e número de perfurações
    const totalDistance = this.calculateTotalDistance(optimizedPath.points);
    const piercePoints = this.countPiercePoints(optimizedPath.points);
    
    return {
      points: optimizedPath.points,
      totalDistance,
      piercePoints
    };
  }

  private calculateCutPoints(pieces: SheetPlacedPiece[]): CutPoint[] {
    const cutPoints: CutPoint[] = [];
    
    pieces.forEach(piece => {
      // Definir ponto de entrada otimizado baseado no processo
      const entryPoint = this.calculateOptimalEntryPoint(piece);
      
      cutPoints.push({
        x: entryPoint.x,
        y: entryPoint.y,
        piece,
        type: 'entry'
      });
      
      // Adicionar pontos de início e fim do corte
      cutPoints.push({
        x: piece.x,
        y: piece.y,
        piece,
        type: 'start'
      });
      
      cutPoints.push({
        x: piece.x + piece.width,
        y: piece.y + piece.height,
        piece,
        type: 'end'
      });
    });
    
    return cutPoints;
  }

  private calculateOptimalEntryPoint(piece: SheetPlacedPiece): { x: number; y: number } {
    // Estratégias de entrada baseadas no processo
    switch (this.process) {
      case 'plasma':
        // Plasma: preferir cantos para melhor qualidade
        return {
          x: piece.x + 5, // Pequeno offset do canto
          y: piece.y + 5
        };
        
      case 'oxicorte':
        // Oxicorte: preferir bordas laterais para evitar deformação
        return {
          x: piece.x,
          y: piece.y + piece.height / 2
        };
        
      default:
        // Padrão: canto inferior esquerdo
        return {
          x: piece.x,
          y: piece.y
        };
    }
  }

  private nearestNeighborTSP(cutPoints: CutPoint[]): CutPath {
    if (cutPoints.length === 0) {
      return { points: [], totalDistance: 0, piercePoints: 0 };
    }
    
    const unvisited = [...cutPoints];
    const path: CutPoint[] = [];
    
    // Começar do ponto mais próximo da origem (0,0)
    let currentPoint = this.findNearestToOrigin(unvisited);
    path.push(currentPoint);
    unvisited.splice(unvisited.indexOf(currentPoint), 1);
    
    // Aplicar algoritmo do vizinho mais próximo
    while (unvisited.length > 0) {
      let nearestPoint = unvisited[0];
      let minDistance = this.calculateDistance(currentPoint, nearestPoint);
      
      for (let i = 1; i < unvisited.length; i++) {
        const distance = this.calculateDistance(currentPoint, unvisited[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestPoint = unvisited[i];
        }
      }
      
      path.push(nearestPoint);
      unvisited.splice(unvisited.indexOf(nearestPoint), 1);
      currentPoint = nearestPoint;
    }
    
    return { points: path, totalDistance: 0, piercePoints: 0 };
  }

  private findNearestToOrigin(points: CutPoint[]): CutPoint {
    let nearest = points[0];
    let minDistance = Math.sqrt(nearest.x * nearest.x + nearest.y * nearest.y);
    
    for (let i = 1; i < points.length; i++) {
      const distance = Math.sqrt(points[i].x * points[i].x + points[i].y * points[i].y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = points[i];
      }
    }
    
    return nearest;
  }

  private calculateDistance(point1: CutPoint, point2: CutPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateTotalDistance(points: CutPoint[]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < points.length; i++) {
      totalDistance += this.calculateDistance(points[i-1], points[i]);
    }
    
    return totalDistance;
  }

  private countPiercePoints(points: CutPoint[]): number {
    return points.filter(point => point.type === 'entry').length;
  }

  // Otimizar para minimizar deformação térmica
  optimizeForThermalDistortion(pieces: SheetPlacedPiece[]): CutPath {
    // Agrupar peças por proximidade
    const clusters = this.clusterPieces(pieces);
    
    // Alternar entre clusters para permitir resfriamento
    const optimizedSequence: CutPoint[] = [];
    let currentCluster = 0;
    
    while (clusters.some(cluster => cluster.length > 0)) {
      if (clusters[currentCluster].length > 0) {
        const piece = clusters[currentCluster].shift()!;
        const cutPoints = this.calculateCutPoints([piece]);
        optimizedSequence.push(...cutPoints);
      }
      
      currentCluster = (currentCluster + 1) % clusters.length;
    }
    
    return {
      points: optimizedSequence,
      totalDistance: this.calculateTotalDistance(optimizedSequence),
      piercePoints: this.countPiercePoints(optimizedSequence)
    };
  }

  private clusterPieces(pieces: SheetPlacedPiece[]): SheetPlacedPiece[][] {
    const clusters: SheetPlacedPiece[][] = [];
    const used = new Set<SheetPlacedPiece>();
    
    pieces.forEach(piece => {
      if (used.has(piece)) return;
      
      const cluster: SheetPlacedPiece[] = [piece];
      used.add(piece);
      
      // Encontrar peças próximas
      pieces.forEach(otherPiece => {
        if (used.has(otherPiece)) return;
        
        const distance = Math.sqrt(
          Math.pow(piece.x - otherPiece.x, 2) + 
          Math.pow(piece.y - otherPiece.y, 2)
        );
        
        // Se está próxima (menos de 100mm), adicionar ao cluster
        if (distance < 100) {
          cluster.push(otherPiece);
          used.add(otherPiece);
        }
      });
      
      clusters.push(cluster);
    });
    
    return clusters;
  }

  // Gerar código G para máquinas CNC
  generateGCode(cutPath: CutPath): string[] {
    const gcode: string[] = [];
    
    // Cabeçalho
    gcode.push('G21 ; Unidades em milímetros');
    gcode.push('G90 ; Coordenadas absolutas');
    gcode.push('M03 ; Ligar plasma/oxicorte');
    gcode.push('');
    
    // Sequência de corte
    cutPath.points.forEach((point, index) => {
      switch (point.type) {
        case 'entry':
          gcode.push(`; Entrada para peça ${point.piece.tag}`);
          gcode.push(`G00 X${point.x.toFixed(2)} Y${point.y.toFixed(2)} ; Movimento rápido`);
          gcode.push('M07 ; Iniciar perfuração');
          gcode.push('G04 P0.5 ; Pausa para perfuração');
          break;
          
        case 'start':
          gcode.push(`G01 X${point.x.toFixed(2)} Y${point.y.toFixed(2)} ; Início do corte`);
          break;
          
        case 'end':
          gcode.push(`G01 X${point.x.toFixed(2)} Y${point.y.toFixed(2)} ; Fim do corte`);
          gcode.push('M08 ; Parar perfuração');
          gcode.push('');
          break;
      }
    });
    
    // Rodapé
    gcode.push('M05 ; Desligar plasma/oxicorte');
    gcode.push('G00 X0 Y0 ; Retornar à origem');
    gcode.push('M30 ; Fim do programa');
    
    return gcode;
  }
}
