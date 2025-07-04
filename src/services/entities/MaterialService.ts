
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
    tipo_corte?: string;
  }) {
    const { data, error } = await supabase
      .from("materiais")
      .insert([{
        ...novoMaterial,
        tipo_corte: novoMaterial.tipo_corte || 'barra'
      }]);

    if (error) throw error;
    return;
  }

  async getByTipoCorte(tipoCorte: 'barra' | 'chapa') {
    try {
      const { data, error } = await supabase
        .from("materiais")
        .select("*")
        .eq("tipo_corte", tipoCorte)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        success: true,
        total: data?.length || 0,
      };
    } catch (error) {
      return this.handleError(error, `Erro ao buscar materiais do tipo ${tipoCorte}`);
    }
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
