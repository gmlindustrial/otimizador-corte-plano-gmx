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
  tag_peca: string;
  conjunto?: string;
  perfil_id?: string;
  descricao_perfil_raw?: string;
  comprimento_mm: number;
  quantidade: number;
  peso_por_metro?: number;
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