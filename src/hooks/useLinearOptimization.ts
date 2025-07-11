import { useState } from 'react';
import type { Project, CutPiece, OptimizationResult } from '@/pages/Index';
import { useEstoqueSobras } from '@/hooks/useEstoqueSobras';

// Expandir interface para incluir informações detalhadas das peças
interface ExpandedPiece {
  length: number;
  originalIndex: number;
  originalPiece: CutPiece;
  // Informações preservadas do AutoCAD
  conjunto?: string;
  tag?: string;
  perfil?: string;
  material?: string;
  peso?: number;
  obra?: string;
  posicao?: number;
}

interface EnhancedBarPiece {
  length: number;
  color: string;
  label: string;
  // Informações adicionais preservadas
  conjunto?: string;
  tag?: string;
  perfil?: string;
  material?: string;
  peso?: number;
  obra?: string;
  posicao?: number;
}

// Nova interface para barras otimizadas com informação de sobras
interface OptimizedBar {
  id: string;
  type: 'new' | 'leftover';
  originalLength: number;
  pieces: EnhancedBarPiece[];
  waste: number;
  totalUsed: number;
  estoque_id?: string;
  economySaved?: number;
}

// Expandir OptimizationResult para incluir métricas de sustentabilidade
interface ExtendedOptimizationResult extends OptimizationResult {
  sustainability?: {
    leftoverBarsUsed: number;
    newBarsUsed: number;
    materialReused: number; // em mm
    totalEconomy: number; // em R$
    wasteReduction: number; // em %
  };
}

export const useLinearOptimization = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [barLength, setBarLength] = useState(6000);
  const [pieces, setPieces] = useState<CutPiece[]>([]);
  const [results, setResults] = useState<ExtendedOptimizationResult | null>(null);
  
  const { sobras, usarSobra } = useEstoqueSobras();

  const handleOptimize = () => {
    if (pieces.length === 0) return null;

    console.log('=== INICIANDO OTIMIZAÇÃO ===');
    console.log('Projeto:', project);
    console.log('Sobras disponíveis:', sobras.length);

    // Preparar peças para otimização
    const sortedPieces: ExpandedPiece[] = [];
    pieces.forEach((piece, index) => {
      for (let i = 0; i < piece.quantity; i++) {
        sortedPieces.push({ 
          length: piece.length, 
          originalIndex: index,
          originalPiece: piece,
          // Preservar informações do AutoCAD se existirem
          conjunto: (piece as any).conjunto,
          tag: (piece as any).tag,
          perfil: (piece as any).perfil,
          material: (piece as any).material,
          peso: (piece as any).peso,
          obra: (piece as any).obra,
          posicao: (piece as any).posicao
        });
      }
    });
    
    // Ordenar por tamanho decrescente
    sortedPieces.sort((a, b) => b.length - a.length);

    // Filtrar e ordenar sobras disponíveis
    const expandedLeftovers = sobras.flatMap(s =>
      Array.from({ length: s.quantidade }).map((_, i) => ({
        ...s,
        uniqueId: `${s.id}-${i}`
      }))
    ).filter(s => s.comprimento >= 100)
      .sort((a, b) => b.comprimento - a.comprimento);

    const bars: OptimizedBar[] = [];
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
    const cutLoss = 3; // 3mm perda por corte

    // Métricas de sustentabilidade
    let leftoverBarsUsed = 0;
    let newBarsUsedCount = 0;
    let totalEconomy = 0;
    let materialReused = 0;

    // FASE 1: Tentar usar sobras disponíveis primeiro
    const usedLeftovers = new Set<string>();
    const usageCount: Record<string, number> = {};
    
    for (const piece of [...sortedPieces]) {
      let placed = false;

      // Tentar colocar na sobra disponível
      for (const leftover of expandedLeftovers) {
        if (usedLeftovers.has(leftover.uniqueId)) continue;

        // Verificar se existe barra de sobra já iniciada
        let leftoverBar = bars.find(bar => 
          bar.type === 'leftover' &&
          bar.estoque_id === leftover.uniqueId
        );

        if (!leftoverBar) {
          // Criar nova barra de sobra
          leftoverBar = {
            id: `leftover-${leftover.uniqueId}`,
            type: 'leftover',
            originalLength: leftover.comprimento,
            pieces: [],
            waste: 0,
            totalUsed: 0,
            estoque_id: leftover.uniqueId,
            economySaved: 0
          };
          bars.push(leftoverBar);
          leftoverBarsUsed++;
        }

        const availableSpace = leftover.comprimento - leftoverBar.totalUsed;
        const spaceNeeded = piece.length + (leftoverBar.pieces.length > 0 ? cutLoss : 0);
        
        if (availableSpace >= spaceNeeded) {
          leftoverBar.pieces.push({
            length: piece.length,
            color: colors[piece.originalIndex % colors.length],
            label: piece.tag || `${piece.length}mm`,
            // Preservar todas as informações
            conjunto: piece.conjunto,
            tag: piece.tag,
            perfil: piece.perfil,
            material: piece.material,
            peso: piece.peso,
            obra: piece.obra,
            posicao: piece.posicao
          });
          
          leftoverBar.totalUsed += spaceNeeded;
          leftoverBar.waste = leftover.comprimento - leftoverBar.totalUsed;
          
          // Calcular economia (assumindo R$ 8,00/metro como custo padrão)
          const economyPerPiece = (piece.length / 1000) * 8; // R$/metro
          leftoverBar.economySaved = (leftoverBar.economySaved || 0) + economyPerPiece;
          totalEconomy += economyPerPiece;
          materialReused += piece.length;
          
          placed = true;
          usedLeftovers.add(leftover.uniqueId);
          usageCount[leftover.id] = (usageCount[leftover.id] || 0) + 1;
          
          // Remover peça da lista
          const pieceIndex = sortedPieces.indexOf(piece);
          if (pieceIndex > -1) {
            sortedPieces.splice(pieceIndex, 1);
          }
          break;
        }
      }
    }

    // FASE 2: Usar barras novas para peças restantes
    for (const piece of sortedPieces) {
      let placed = false;

      // Tentar colocar em barra nova existente
      for (const bar of bars.filter(b => b.type === 'new')) {
        const availableSpace = barLength - bar.totalUsed;
        const spaceNeeded = piece.length + (bar.pieces.length > 0 ? cutLoss : 0);
        
        if (availableSpace >= spaceNeeded) {
          bar.pieces.push({
            length: piece.length,
            color: colors[piece.originalIndex % colors.length],
            label: piece.tag || `${piece.length}mm`,
            conjunto: piece.conjunto,
            tag: piece.tag,
            perfil: piece.perfil,
            material: piece.material,
            peso: piece.peso,
            obra: piece.obra,
            posicao: piece.posicao
          });
          bar.totalUsed += spaceNeeded;
          bar.waste = barLength - bar.totalUsed;
          placed = true;
          break;
        }
      }

      // Se não coube, criar nova barra
      if (!placed) {
        const newBar: OptimizedBar = {
          id: `new-bar-${bars.filter(b => b.type === 'new').length + 1}`,
          type: 'new',
          originalLength: barLength,
          pieces: [{
            length: piece.length,
            color: colors[piece.originalIndex % colors.length],
            label: piece.tag || `${piece.length}mm`,
            conjunto: piece.conjunto,
            tag: piece.tag,
            perfil: piece.perfil,
            material: piece.material,
            peso: piece.peso,
            obra: piece.obra,
            posicao: piece.posicao
          }],
          waste: 0,
          totalUsed: piece.length
        };
        newBar.waste = barLength - newBar.totalUsed;
        bars.push(newBar);
        newBarsUsedCount++;
      }
    }

    // Calcular estatísticas finais
    const totalWaste = bars.reduce((sum, bar) => sum + bar.waste, 0);
    const totalMaterial = bars.reduce((sum, bar) => sum + bar.originalLength, 0);
    const wastePercentage = (totalWaste / totalMaterial) * 100;
    const wasteReduction = materialReused > 0 ? (materialReused / (materialReused + (newBarsUsedCount * barLength))) * 100 : 0;

    // Filtrar apenas barras que têm peças
    const filteredBars = bars.filter(bar => bar.pieces.length > 0);
    
    const optimizationResult: ExtendedOptimizationResult = {
      bars: filteredBars.map(bar => ({
        id: bar.id,
        pieces: bar.pieces,
        waste: bar.waste,
        totalUsed: bar.totalUsed,
        // Preservar informações extras para visualização
        ...(bar.type === 'leftover' && {
          type: bar.type,
          estoque_id: bar.estoque_id,
          economySaved: bar.economySaved,
          originalLength: bar.originalLength
        }),
        ...(bar.type === 'new' && {
          type: bar.type,
          originalLength: bar.originalLength
        })
      })),
      totalBars: filteredBars.length,
      totalWaste,
      wastePercentage,
      efficiency: 100 - wastePercentage,
      sustainability: {
        leftoverBarsUsed,
        newBarsUsed: newBarsUsedCount,
        materialReused,
        totalEconomy,
        wasteReduction
      }
    };

    console.log('=== RESULTADO DA OTIMIZAÇÃO ===');
    console.log('Total de barras:', optimizationResult.totalBars);
    console.log('Eficiência:', optimizationResult.efficiency);
    console.log('Sobras utilizadas:', leftoverBarsUsed);
    console.log('Novas barras:', newBarsUsedCount);

    // Atualizar estoque de sobras consumidas
    Object.entries(usageCount).forEach(([id, qty]) => {
      usarSobra(id, qty);
    });

    setResults(optimizationResult);
    return optimizationResult;
  };

  return {
    project,
    setProject,
    barLength,
    setBarLength,
    pieces,
    setPieces,
    results,
    setResults,
    handleOptimize
  };
};
