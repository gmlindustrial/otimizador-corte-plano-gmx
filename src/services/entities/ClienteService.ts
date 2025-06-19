import { BaseService } from "../base/BaseService";
import { supabase } from "@/integrations/supabase/client";
import type { Cliente } from "../interfaces";
import { ListResponse, QueryOptions } from "../base/types";

export class ClienteService extends BaseService<Cliente> {
  constructor() {
    super("clientes");
  }

  async criarCliente(novoCliente: {
    nome: string;
    contato: string;
    email: string;
    telefone: string;
  }) {
    const { data, error } = await supabase
      .from("clientes")
      .insert([novoCliente]);

    if (error) throw error;
    return data && data[0] ? data[0] : null;
  }

  async getByNome(nome: string) {
    try {
      const { data, error } = await supabase
        .from("clientes")
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
      return this.handleError(error, "Erro ao buscar clientes por nome");
    }
  }

  async getAll(options?: QueryOptions): Promise<ListResponse<Cliente>> {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: (data as Cliente[]) || [],
        error: null,
        success: true,
        total: data?.length || 0,
      };
    } catch (error) {
      return this.handleError(error, "Erro ao buscar todos os clientes");
    }
  }
}

export const clienteService = new ClienteService();
