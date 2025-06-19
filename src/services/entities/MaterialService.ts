import { BaseService } from "../base/BaseService";
import { supabase } from "@/integrations/supabase/client";
import type { Material } from "../interfaces";
import { ListResponse, QueryOptions } from "../base/types";

export class MaterialService extends BaseService<Material> {
  constructor() {
    super("materiais"); // nome da tabela no Supabase
  }

  async criarMaterial(novoMaterial: {
    tipo: string;
    descricao: string;
    comprimento_padrao: number;
  }) {
    const { data, error } = await supabase
      .from("materiais")
      .insert([novoMaterial]);

    if (error) throw error;
    return;
  }

  async getByTipo(tipo: string) {
    try {
      const { data, error } = await supabase
        .from("materiais")
        .select("*")
        .ilike("tipo", `%${tipo}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0,
      };
    } catch (error) {
      return this.handleError(error, "Erro ao buscar materiais por tipo");
    }
  }

  async getAll(options?: QueryOptions): Promise<ListResponse<Material>> {
    try {
      const { data, error } = await supabase
        .from("materiais")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: (data as Material[]) || [],
        error: null,
        success: true,
        total: data?.length || 0,
      };
    } catch (error) {
      return this.handleError(
        error,
        "Erro ao buscar todos os tipos de materiais"
      );
    }
  }
}
export const materialService = new MaterialService();
