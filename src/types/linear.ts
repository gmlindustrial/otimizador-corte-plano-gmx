/**
 * Tipos unificados para o algoritmo de otimizacao linear (1D)
 *
 * Este arquivo centraliza todas as interfaces relacionadas ao corte linear,
 * eliminando duplicacoes entre BestFitOptimizer, useLinearOptimization e runLinearOptimization.
 */

/**
 * Peca individual dentro de uma barra cortada
 */
export interface LinearBarPiece {
  /** ID da peca no banco de dados (ProjetoPeca.id) - usado para sincronizacao */
  id?: string;
  /** Comprimento da peca em mm */
  length: number;
  /** Cor para visualizacao */
  color?: string;
  /** Label para exibicao */
  label?: string;
  /** Tag identificadora (ex: "COLUNA-01") */
  tag?: string;
  /** Posicao no projeto (ex: "POS-001") */
  posicao?: string;
  /** Fase do projeto */
  fase?: string;
  /** Perfil do material (ex: "W 200x26.6") */
  perfil?: string;
  /** ID do perfil no banco */
  perfilId?: string;
  /** Peso da peca em kg */
  peso?: number;
  /** Indice original na lista de entrada */
  originalIndex?: number;
  /** Status de corte - PADRONIZADO como 'cortada' */
  cortada?: boolean;
  /** Informacoes da peca original (quando parte de emenda) */
  pecaOriginal?: {
    comprimentoTotal: number;
    tag?: string;
    posicao?: string;
  };
}

/**
 * Barra (nova ou sobra) com pecas alocadas
 */
export interface LinearBar {
  /** ID unico da barra (ex: "new-1", "leftover-uuid") */
  id: string;
  /** Tipo: nova barra ou sobra reaproveitada */
  type: 'new' | 'leftover';
  /** Comprimento original da barra em mm */
  originalLength: number;
  /** Pecas alocadas nesta barra */
  pieces: LinearBarPiece[];
  /** Total utilizado (soma dos comprimentos + cutloss entre pecas) */
  totalUsed: number;
  /** Desperdicio (originalLength - totalUsed) */
  waste: number;
  /** ID da sobra no estoque (quando type='leftover') */
  estoque_id?: string;
  /** Score de qualidade do encaixe (para ordenacao) */
  score?: number;
  /** Indica se a barra contem emendas */
  temEmenda?: boolean;
  /** Informacoes detalhadas da emenda (quando temEmenda=true) */
  informacoesEmenda?: LinearEmendaInfo;
  /** Economia gerada ao usar sobras (R$) */
  economySaved?: number;
  /** Nome da sobra usada nesta barra (ex: "Sobra 1") */
  sobraUsada?: string;
  /** Nome da sobra gerada por esta barra (ex: "Sobra 1") */
  geraSobra?: string;
  /** Comprimento da sobra em mm */
  sobraComprimento?: number;
  /** Se a sobra pode ser usada para emendas */
  sobraUtilizavel?: boolean;
  /** ID da barra que usou a sobra desta barra */
  sobraUsadaPor?: string;
  /** Detalhes completos da emenda para visualizacao separada */
  emendaDetalhes?: {
    pecaTag?: string;
    pecaPosicao?: string;
    comprimentoTotal: number;
    sobraNome: string;
    sobraComprimento: number;
    barraOrigemSobra: string;
    comprimentoNovaBarra: number;
  };
}

/**
 * Informacoes detalhadas de uma peca com emenda
 */
export interface LinearEmendaInfo {
  /** ID da peca */
  id: string;
  /** Comprimento original requisitado */
  comprimentoOriginal: number;
  /** Tag da peca */
  tag?: string;
  /** Posicao no projeto */
  posicao?: string;
  /** Fase do projeto */
  fase?: string;
  /** Perfil do material */
  perfil?: string;
  /** Peso em kg */
  peso?: number;
  /** ID do perfil */
  perfilId?: string;
  /** Quantidade */
  quantidade: number;
  /** Segmentos que compoem a emenda */
  segmentos: LinearSegmentoEmenda[];
  /** Pontos de emenda */
  emendas: LinearEmendaPonto[];
  /** Status de qualidade */
  statusQualidade: 'pendente' | 'aprovada' | 'reprovada';
  /** Indica que tem emenda */
  temEmenda: boolean;
  /** Observacoes adicionais */
  observacoes?: string;
}

/**
 * Segmento individual de uma peca com emenda
 */
export interface LinearSegmentoEmenda {
  /** Comprimento do segmento em mm */
  comprimento: number;
  /** Origem do material */
  origemTipo: 'sobra' | 'nova_barra';
  /** ID da origem */
  origemId: string;
  /** ID do perfil */
  perfilId: string;
  /** Posicao na barra (offset) */
  posicaoNaBarra: number;
  /** ID do estoque quando sobra */
  estoqueId?: string;
}

/**
 * Ponto de emenda entre segmentos
 */
export interface LinearEmendaPonto {
  /** Posicao da emenda em mm */
  posicao: number;
  /** Indica se afeta qualidade estrutural */
  qualidadeAfetada: boolean;
  /** Requer inspecao obrigatoria */
  inspecaoObrigatoria: boolean;
}

/**
 * Resultado da otimizacao linear
 */
export interface LinearOptimizationResult {
  /** Barras otimizadas */
  bars: LinearBar[];
  /** Eficiencia geral (0-100%) */
  efficiency: number;
  /** Desperdicio total em mm */
  totalWaste: number;
  /** Estrategia utilizada */
  strategy: string;
  /** Pecas que usaram emenda */
  pecasComEmenda?: LinearEmendaInfo[];
  /** Metricas de sustentabilidade */
  sustainability?: {
    /** CO2 evitado em kg */
    co2Saved: number;
    /** Agua economizada em litros */
    waterSaved: number;
    /** Energia economizada em kWh */
    energySaved: number;
    /** Arvores equivalentes preservadas */
    treesEquivalent: number;
  };
}

/**
 * Peca de entrada para otimizacao (formato expandido)
 */
export interface LinearInputPiece {
  /** ID da peca no banco */
  id?: string;
  /** Comprimento em mm */
  length: number;
  /** Quantidade (sera expandida em pecas individuais) */
  quantity: number;
  /** Tag identificadora */
  tag?: string;
  /** Posicao no projeto */
  posicao?: string;
  /** Fase */
  fase?: string;
  /** Perfil */
  perfil?: string;
  /** Peso por unidade em kg */
  peso?: number;
  /** ID do perfil */
  perfilId?: string;
}

/**
 * Sobra disponivel no estoque
 */
export interface LinearLeftover {
  /** ID no banco */
  id: string;
  /** Comprimento disponivel em mm */
  comprimento: number;
  /** Quantidade de unidades disponiveis */
  quantidade: number;
  /** ID do perfil do material */
  id_perfis_materiais?: string;
  /** Descricao do perfil */
  descricao_perfil?: string;
}

/**
 * Configuracao de emendas
 */
export interface LinearEmendaConfig {
  /** Emenda obrigatoria para pecas maiores que barra */
  emendaObrigatoria: boolean;
  /** Permitir emendas opcionais para melhor aproveitamento */
  permitirEmendas: boolean;
  /** Tamanho minimo de sobra para uso em mm */
  tamanhoMinimoSobra: number;
  /** Maximo de emendas por peca */
  maxEmendasPorPeca: number;
}
