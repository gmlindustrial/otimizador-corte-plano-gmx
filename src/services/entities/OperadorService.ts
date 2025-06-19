import { BaseService } from "../base/BaseService";
import { supabase } from "@/integrations/supabase/client";
import type { Material, Operador } from "../interfaces";
import { ListResponse, QueryOptions } from "../base/types";

export class OperadorService extends BaseService<Operador> {
  constructor() {
    super("operadores"); // nome da tabela no Supabase
  }

  async criarOperador(novoOperador: {
    nome: string;
    turno: string;
    especialidade: string;
  }) {
    const { data, error } = await supabase
      .from("operadores")
      .insert([novoOperador]);

    if (error) throw error;
    return; // retorna o operador criado, se necessário
  }

  async getByNome(nome: string) {
    try {
      const { data, error } = await supabase
        .from("operadores")
        .select("*")
        .ilike("nome", `%${nome}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0,
      };
    } catch (error) {
      return this.handleError(error, "Erro ao buscar operadores por nome");
    }
  }

  async getAll(options?: QueryOptions): Promise<ListResponse<Operador>> {
    try {
      const { data, error } = await supabase
        .from("operadores")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: (data as Operador[]) || [],
        error: null,
        success: true,
        total: data?.length || 0,
      };
    } catch (error) {
      return this.handleError(error, "Erro ao buscar todos os operadores");
    }
  }
}

export const operadorService = new OperadorService();
