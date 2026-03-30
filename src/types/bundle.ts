/**
 * Tipos para otimização de corte em amarrado (bundle cutting).
 *
 * Amarrado = múltiplas barras cortadas simultaneamente na serra fita,
 * todas com o mesmo padrão de corte. A quantidade por amarrado depende
 * do perfil do material (cantoneiras cabem mais, perfis W cabem menos).
 */

import type { LinearBar, LinearBarPiece, LinearInputPiece } from './linear';

/**
 * Grupo de peças do mesmo perfil para otimização em amarrado
 */
export interface BundleGroup {
  /** ID do perfil no banco */
  profileId: string;
  /** Descrição do perfil (ex: "W 200x26.6") */
  profileDescription: string;
  /** Tipo do perfil (ex: "W", "L", "U") */
  profileType: string;
  /** Peso por metro (kg/m) */
  kgPerMeter: number;
  /** Máximo de barras por amarrado (vem do cadastro do perfil) */
  maxBarsPerBundle: number;
  /** Peças deste grupo */
  pieces: LinearInputPiece[];
  /** Total de peças (soma das quantidades) */
  totalPieces: number;
}

/**
 * Resultado da otimização de um amarrado individual
 */
export interface BundleResult {
  /** ID único do amarrado */
  bundleId: string;
  /** ID do perfil */
  profileId: string;
  /** Descrição do perfil */
  profileDescription: string;
  /** Quantidade de barras físicas neste amarrado */
  bundleSize: number;
  /** Padrão de corte (layout de 1 barra — replicado para todas) */
  pattern: {
    /** Peças no padrão */
    pieces: LinearBarPiece[];
    /** Comprimento da barra */
    barLength: number;
    /** Total utilizado em mm */
    totalUsed: number;
    /** Sobra por barra em mm */
    wastePerBar: number;
  };
  /** Total de barras replicadas (= bundleSize) */
  replicatedBars: number;
  /** Desperdício total (wastePerBar × bundleSize) */
  totalWaste: number;
  /** Eficiência do amarrado (%) */
  efficiency: number;
  /** Economia vs corte individual (em barras) */
  barsSaved: number;
  /** Economia estimada em R$ */
  costSaving: number;
}

/**
 * Resultado completo da otimização por amarrado
 */
export interface BundleOptimizationResult {
  /** Amarrados gerados */
  bundles: BundleResult[];
  /** Barras individuais (peças que não couberam em amarrado) */
  individualBars: LinearBar[];
  /** Métricas gerais */
  summary: {
    /** Total de barras (amarrados replicados + individuais) */
    totalBars: number;
    /** Total de amarrados */
    totalBundles: number;
    /** Eficiência média */
    averageEfficiency: number;
    /** Desperdício total em mm */
    totalWaste: number;
    /** Economia total em barras (vs corte individual) */
    totalBarsSaved: number;
    /** Economia total estimada em R$ */
    totalCostSaving: number;
    /** Tempo de setup economizado (estimativa) */
    setupTimeSaved: number;
  };
}

/**
 * Configuração do amarrado para um perfil específico
 */
export interface BundleConfig {
  /** Máximo de barras por amarrado */
  maxBarsPerBundle: number;
  /** Fator de kerf do amarrado (1.0 = igual ao individual, 1.2 = 20% a mais) */
  kerfFactor: number;
  /** Custo por barra em R$ (para cálculo de economia) */
  costPerBar: number;
  /** Tempo de setup por corte em minutos */
  setupTimePerCut: number;
}
