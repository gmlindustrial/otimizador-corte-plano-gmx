import { BaseService } from "../base/BaseService";
import { supabase } from "@/integrations/supabase/client";
import type { Obra } from "../interfaces";
import { QueryOptions, ListResponse } from "../base/types";

export class ObraService extends BaseService<Obra> {
  constructor() {
    super("obras");
  }

  async criarObra(novaObra: {
    nome: string;
    endereco: string;
    responsavel: string;
  }): Promise<Obra[]> {
    const { data, error } = await supabase
      .from("obras")
      .insert([novaObra])
      .select(); // Garante retorno do registro inserido

    if (error) throw error;
    return data as Obra[];
  }

  async getByNome(nome: string): Promise<ListResponse<Obra>> {
    try {
      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .ilike("nome", `%${nome}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: (data as Obra[]) || [],
        error: null,
        success: true,
        total: data?.length || 0,
      };
    } catch (error) {
      return this.handleError(error, "Erro ao buscar obras por nome");
    }
  }

  async getAll(options?: QueryOptions): Promise<ListResponse<Obra>> {
    try {
      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: (data as Obra[]) || [],
        error: null,
        success: true,
        total: data?.length || 0,
      };
    } catch (error) {
      return this.handleError(error, "Erro ao buscar todas as obras");
    }
  }
}

export const obraService = new ObraService();
