import type { BaseEntity } from "../base/types";

export interface Lamina extends BaseEntity {
  codigo: string;
  data_instalacao: string;
  status: 'ativada' | 'desativada' | 'descartada' | 'substituida';
  observacoes?: string;
  updated_at?: string;
}

export interface LaminaSubstituicao extends BaseEntity {
  serra_anterior_id: string;
  serra_nova_id: string;
  data_substituicao: string;
  motivo: string;
  operador_id?: string;
  observacoes?: string;
}

export interface LaminaUsoCorte extends BaseEntity {
  serra_id: string;
  projeto_id: string;
  otimizacao_id?: string;
  peca_id?: string;
  quantidade_cortada: number;
  operador_id?: string;
  data_corte: string;
  observacoes?: string;
  peca_posicao?: string;
  peca_tag?: string;
  perfil_id?: string;
}

export interface LaminaStatusHistorico extends BaseEntity {
  serra_id: string;
  status_anterior?: string;
  status_novo: string;
  data_mudanca: string;
  motivo?: string;
  operador_id?: string;
  observacoes?: string;
}

export interface ProjetoDetalhado {
  projeto_id: string;
  projeto_nome: string;
  listas_otimizacao: ListaDetalhada[];
  total_pecas_projeto: number;
  data_primeiro_uso: string;
  data_ultimo_uso: string;
}

export interface ListaDetalhada {
  otimizacao_id: string;
  nome_lista: string;
  quantidade_cortada: number;
  data_corte: string;
}

export interface LaminaEstatisticas {
  lamina: Lamina;
  total_pecas_cortadas: number;
  projetos_utilizados: number;
  primeiro_uso?: string;
  ultimo_uso?: string;
  substituicoes: LaminaSubstituicao[];
  historico_status: LaminaStatusHistorico[];
  projetos_detalhados: ProjetoDetalhado[];
  metricas_tempo: {
    data_criacao: string;
    data_primeira_ativacao?: string;
    data_ultima_ativacao?: string;
    data_ultima_desativacao?: string;
    data_descarte?: string;
    tempo_total_ativo_dias?: number;
    tempo_total_inativo_dias?: number;
  };
}

export interface LaminaUsoDetalhado extends LaminaUsoCorte {
  projeto_nome?: string;
  operador_nome?: string;
  otimizacao_nome?: string;
  perfil_descricao?: string;
  perfil_tipo?: string;
}

export interface LaminaUsoCompleto extends LaminaUsoDetalhado {
  total_pecas_projeto: number;
  peso_total_cortado?: number;
  eficiencia_corte?: number;
}