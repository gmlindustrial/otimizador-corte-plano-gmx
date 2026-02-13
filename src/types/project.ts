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
  fase?: string; // Campo FASE
  perfil_id?: string;
  descricao_perfil_raw?: string;
  comprimento_mm: number;
  quantidade: number;
  peso_por_metro?: number;
  peso?: number; // Peso real extraído do arquivo CAD (kg)
  material?: string; // Material da peça (ex: A572-50, A36)
  perfil_nao_encontrado: boolean;
  status: 'aguardando_otimizacao' | 'otimizada' | 'cortada';
  corte: boolean; // Nova coluna para validar quando uma peça for cortada
  projeto_otimizacao_id?: string;
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
  usarSobrasEstoque?: boolean;       // Consumir sobras existentes do estoque
  cadastrarSobrasGeradas?: boolean;  // Adicionar sobras geradas ao estoque
  usarSobrasInternas?: boolean;      // Usar sobras geradas na própria otimização para emendas
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
  fase?: string;
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
  fase?: string;
  perfil?: string;
  peso?: number;
  perfilId?: string;
}

// ===== INTERFACES PARA SISTEMA DE CHAPAS (2D) =====

export interface ProjetoChapa {
  id: string;
  projeto_id: string;
  tag: string;                           // Item numero do Inventor
  posicao: string;                       // Projeto Numero
  descricao?: string;                    // Descricao original (ex: "Chapa 6,4")
  largura_mm: number;                    // Largura em mm
  altura_mm: number;                     // Altura/comprimento em mm
  espessura_mm?: number;                 // Espessura em mm
  material_id?: string;                  // Referencia ao material cadastrado
  material_descricao_raw?: string;       // Descricao original para matching
  material_nao_encontrado: boolean;      // Flag para material nao encontrado
  quantidade: number;
  peso?: number;                         // Peso em kg
  fase?: string;                         // Fase/modulo do projeto
  status: 'aguardando_otimizacao' | 'otimizada' | 'cortada';
  projeto_otimizacao_chapa_id?: string;  // Vinculo com otimizacao
  created_at: string;
  material?: {                           // Join com tabela materiais
    id: string;
    tipo: string;
    descricao?: string;
    comprimento_padrao: number;
    tipo_corte: string;
  };
}

export interface ProjetoChapaGroup {
  espessura_mm: number;
  material_id?: string;
  material?: ProjetoChapa['material'];
  chapas: ProjetoChapa[];
  total_quantidade: number;
  total_area_mm2: number;
}

export interface ProjetoChapaValidation {
  chapa: ProjetoChapa;
  isValid: boolean;
  suggestions: ProjetoChapa['material'][];
}
