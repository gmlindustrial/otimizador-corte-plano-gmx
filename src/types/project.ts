export interface PerfilMaterial {
  id: string;
  descricao_perfil: string;
  kg_por_metro: number;
  tipo_perfil: string;
  created_at: string;
}

export interface ProjetoPeca {
  id: string;
  projeto_id: string;
  posicao: string;
  tag?: string;
  perfil_id?: string;
  descricao_perfil_raw?: string;
  comprimento_mm: number;
  quantidade: number;
  peso_por_metro?: number;
  peso?: number; // Peso real extraído do arquivo CAD (kg)
  perfil_nao_encontrado: boolean;
  created_at: string;
  perfil?: PerfilMaterial;
}

export interface ProjetoOtimizacao {
  id: string;
  projeto_id: string;
  nome_lista: string;
  perfil_id?: string;
  tamanho_barra: number;
  pecas_selecionadas: string[];
  resultados?: any;
  created_at: string;
  perfil?: PerfilMaterial;
}

export interface ProjectPieceValidation {
  peca: ProjetoPeca;
  isValid: boolean;
  suggestions: PerfilMaterial[];
}

// ===== INTERFACES PARA SISTEMA DE EMENDAS =====

export interface EmendaConfiguration {
  emendaObrigatoria: boolean;
  permitirEmendas: boolean;
  tamanhoMinimoSobra: number;
  maxEmendasPorPeca: number;
  prioridadeEstoque: 'sobra_mesmo_perfil' | 'sobra_qualquer' | 'nova_barra';
}

export interface SegmentoEmenda {
  comprimento: number;
  origemTipo: 'sobra' | 'nova_barra';
  origemId: string;
  perfilId: string;
  posicaoNaBarra: number;
  estoqueId?: string;
}

export interface EmendaInfo {
  posicao: number;
  qualidadeAfetada: boolean;
  inspecaoObrigatoria: boolean;
}

export interface PecaComEmenda {
  id: string;
  comprimentoOriginal: number;
  tag?: string;
  posicao?: string;
  conjunto?: string;
  perfil?: string;
  peso?: number;
  perfilId?: string;
  quantidade: number;
  segmentos: SegmentoEmenda[];
  emendas: EmendaInfo[];
  statusQualidade: 'pendente' | 'aprovada' | 'reprovada';
  temEmenda: boolean;
  observacoes?: string;
}

export interface OptimizationPiece {
  id: string;
  length: number;
  quantity: number;
  tag?: string;
  posicao?: string;
  conjunto?: string;
  perfil?: string;
  peso?: number;
  perfilId?: string;
}
