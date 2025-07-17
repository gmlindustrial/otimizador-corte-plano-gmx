import { PerfilMaterial } from "@/types/project";
import type { BaseEntity } from "../base/types";

export interface Obra extends BaseEntity {
  nome: string;
  endereco?: string;
  responsavel?: string;
}

export interface Cliente extends BaseEntity {
  nome: string;
  contato?: string;
  email?: string;
  telefone?: string;
}

export interface Material extends BaseEntity {
  tipo: string;
  descricao?: string;
  comprimento_padrao: number;
  tipo_corte: string;
}

export interface Operador extends BaseEntity {
  nome: string;
  turno: string;
  especialidade?: string;
}

export interface InspetorQA extends BaseEntity {
  nome: string;
  certificacao?: string;
  area?: string;
}

export interface Projeto extends BaseEntity {
  nome: string;
  numero_projeto: string;
  cliente_id?: string;
  obra_id?: string;
}

export interface EstoqueSobra extends BaseEntity {
  comprimento: number;
  quantidade: number;
  id_projeto_otimizacao?: string;
  perfis_materiais: PerfilMaterial;
}

export interface HistoricoOtimizacao extends BaseEntity {
  projeto_id?: string;
  pecas: any;
  resultados: any;
  bar_length: number;
}

export interface Usuario extends BaseEntity {
  nome: string;
  email: string;
  role: string;
}
