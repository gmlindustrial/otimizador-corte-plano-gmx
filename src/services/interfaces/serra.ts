import type { BaseEntity } from "../base/types";

export interface Serra extends BaseEntity {
  codigo: string;
  data_instalacao: string;
  status: 'ativa' | 'substituida' | 'manutencao';
  observacoes?: string;
  updated_at?: string;
}

export interface SerraSubstituicao extends BaseEntity {
  serra_anterior_id: string;
  serra_nova_id: string;
  data_substituicao: string;
  motivo: string;
  operador_id?: string;
  observacoes?: string;
}

export interface SerraUsoCorte extends BaseEntity {
  serra_id: string;
  projeto_id: string;
  otimizacao_id?: string;
  peca_id?: string;
  quantidade_cortada: number;
  operador_id?: string;
  data_corte: string;
  observacoes?: string;
}

export interface SerraEstatisticas {
  serra: Serra;
  total_pecas_cortadas: number;
  projetos_utilizados: number;
  primeiro_uso?: string;
  ultimo_uso?: string;
  substituicoes: SerraSubstituicao[];
}

export interface SerraUsoDetalhado extends SerraUsoCorte {
  projeto_nome?: string;
  operador_nome?: string;
  peca_posicao?: string;
  otimizacao_nome?: string;
}