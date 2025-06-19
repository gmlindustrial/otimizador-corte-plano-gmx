import { BaseService } from "../base/BaseService";
import { supabase } from "@/integrations/supabase/client";
import type { InspetorQA } from "../interfaces";
import type { QueryOptions } from "../base/types";
import { ListResponse } from "../base/types";

export class InspetorService extends BaseService<InspetorQA> {
  constructor() {
    super("inspetor_qa"); // nome da tabela no Supabase
  }

  async criarInspetor(novoInspetor: {
    nome: string;
    certificacao: string;
    area: string;
  }) {
    const { data, error } = await supabase
      .from("inspetores_qa")
      .insert([novoInspetor]);

    if (error) throw error;
    return;
  }

  async getByNome(nome: string) {
    try {
      const { data, error } = await supabase
        .from("inspetores_qa")
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
      return this.handleError(error, "Erro ao buscar inspetores por nome");
    }
  }

  async getAll(options?: QueryOptions): Promise<ListResponse<InspetorQA>> {
    try {
      const { data, error } = await supabase
        .from("inspetores_qa")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: (data as InspetorQA[]) || [],
        error: null,
        success: true,
        total: data?.length || 0,
      };
    } catch (error) {
      return this.handleError(error, "Erro ao buscar todos os inspetores");
    }
  }
}

export const inspetorService = new InspetorService();
