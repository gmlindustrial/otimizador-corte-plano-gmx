/**
 * Funcoes de conversao entre tipos de pecas
 *
 * Mapeia entre:
 * - ProjetoPeca (banco de dados)
 * - LinearInputPiece (entrada do algoritmo)
 * - LinearBarPiece (resultado do algoritmo)
 */

import type { ProjetoPeca, OptimizationPiece } from '@/types/project';
import type { LinearInputPiece, LinearBarPiece, LinearBar } from '@/types/linear';

/**
 * Converte ProjetoPeca do banco para formato de entrada do algoritmo
 */
export function projetoPecaToLinearInput(peca: ProjetoPeca): LinearInputPiece {
  return {
    id: peca.id,
    length: peca.comprimento_mm,
    quantity: peca.quantidade,
    tag: peca.tag,
    posicao: peca.posicao,
    fase: peca.fase,
    perfil: peca.perfil?.descricao_perfil,
    peso: peca.peso,
    perfilId: peca.perfil_id,
  };
}

/**
 * Converte lista de ProjetoPeca para formato de entrada
 */
export function projetoPecasToLinearInputs(pecas: ProjetoPeca[]): LinearInputPiece[] {
  return pecas.map(projetoPecaToLinearInput);
}

/**
 * Converte OptimizationPiece (formato antigo) para LinearInputPiece
 */
export function optimizationPieceToLinearInput(piece: OptimizationPiece): LinearInputPiece {
  return {
    id: piece.id,
    length: piece.length,
    quantity: piece.quantity,
    tag: piece.tag,
    posicao: piece.posicao,
    fase: piece.fase,
    perfil: piece.perfil,
    peso: piece.peso,
    perfilId: piece.perfilId,
  };
}

/**
 * Cria LinearBarPiece a partir de dados do algoritmo preservando o ID original
 */
export function createLinearBarPiece(
  length: number,
  originalPiece?: { id?: string; tag?: string; posicao?: string; fase?: string; perfil?: string; peso?: number; perfilId?: string },
  options?: { color?: string; label?: string; originalIndex?: number }
): LinearBarPiece {
  return {
    id: originalPiece?.id,
    length,
    tag: originalPiece?.tag,
    posicao: originalPiece?.posicao,
    fase: originalPiece?.fase,
    perfil: originalPiece?.perfil,
    perfilId: originalPiece?.perfilId,
    peso: originalPiece?.peso,
    color: options?.color,
    label: options?.label,
    originalIndex: options?.originalIndex,
    cortada: false,
  };
}

/**
 * Extrai informacoes para sincronizacao de uma peca no resultado
 * Retorna chave composta para identificacao unica
 */
export interface PieceSyncKey {
  id?: string;
  tag?: string;
  posicao?: string;
  comprimento_mm: number;
  perfilId?: string;
}

export function extractPieceSyncKey(piece: LinearBarPiece): PieceSyncKey {
  return {
    id: piece.id,
    tag: piece.tag,
    posicao: piece.posicao,
    comprimento_mm: piece.length,
    perfilId: piece.perfilId,
  };
}

/**
 * Extrai todas as pecas cortadas de um resultado de otimizacao
 */
export function extractCutPiecesFromBars(bars: LinearBar[]): PieceSyncKey[] {
  const cutPieces: PieceSyncKey[] = [];

  for (const bar of bars) {
    for (const piece of bar.pieces) {
      if (piece.cortada === true) {
        cutPieces.push(extractPieceSyncKey(piece));
      }
    }
  }

  return cutPieces;
}

/**
 * Valida se uma peca tem informacoes suficientes para sincronizacao
 */
export function canSyncPiece(piece: LinearBarPiece): boolean {
  // Preferir ID, mas aceitar chave composta como fallback
  if (piece.id) {
    return true;
  }
  return !!(piece.tag && piece.posicao && piece.length);
}

/**
 * Gera cor baseada no indice da peca (para visualizacao)
 */
export function generatePieceColor(index: number): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#ec4899', // pink
    '#6366f1', // indigo
  ];
  return colors[index % colors.length];
}

/**
 * Gera label para exibicao da peca
 */
export function generatePieceLabel(piece: LinearBarPiece): string {
  if (piece.tag) {
    return piece.posicao ? `${piece.tag} (${piece.posicao})` : piece.tag;
  }
  return `${piece.length}mm`;
}
