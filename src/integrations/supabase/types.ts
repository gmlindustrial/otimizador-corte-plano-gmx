export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          context: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_type: string
          context?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_type?: string
          context?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          contato: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      estoque_sobras: {
        Row: {
          comprimento: number
          created_at: string
          id: string
          id_perfis_materiais: string | null
          id_projeto_otimizacao: string | null
          quantidade: number
        }
        Insert: {
          comprimento: number
          created_at?: string
          id?: string
          id_perfis_materiais?: string | null
          id_projeto_otimizacao?: string | null
          quantidade?: number
        }
        Update: {
          comprimento?: number
          created_at?: string
          id?: string
          id_perfis_materiais?: string | null
          id_projeto_otimizacao?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "estoque_sobras_perfil_fkey"
            columns: ["id_perfis_materiais"]
            isOneToOne: false
            referencedRelation: "perfis_materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_otimizacoes: {
        Row: {
          bar_length: number
          created_at: string
          id: string
          pecas: Json
          projeto_id: string | null
          resultados: Json
        }
        Insert: {
          bar_length: number
          created_at?: string
          id?: string
          pecas: Json
          projeto_id?: string | null
          resultados: Json
        }
        Update: {
          bar_length?: number
          created_at?: string
          id?: string
          pecas?: Json
          projeto_id?: string | null
          resultados?: Json
        }
        Relationships: [
          {
            foreignKeyName: "historico_otimizacoes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      inspetores_qa: {
        Row: {
          area: string | null
          certificacao: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          area?: string | null
          certificacao?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          area?: string | null
          certificacao?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      materiais: {
        Row: {
          comprimento_padrao: number
          created_at: string
          descricao: string | null
          id: string
          tipo: string
          tipo_corte: string
        }
        Insert: {
          comprimento_padrao?: number
          created_at?: string
          descricao?: string | null
          id?: string
          tipo: string
          tipo_corte?: string
        }
        Update: {
          comprimento_padrao?: number
          created_at?: string
          descricao?: string | null
          id?: string
          tipo?: string
          tipo_corte?: string
        }
        Relationships: []
      }
      material_prices: {
        Row: {
          created_at: string
          effective_date: string
          id: string
          material_id: string
          price_per_kg: number
          price_per_m2: number | null
        }
        Insert: {
          created_at?: string
          effective_date?: string
          id?: string
          material_id: string
          price_per_kg?: number
          price_per_m2?: number | null
        }
        Update: {
          created_at?: string
          effective_date?: string
          id?: string
          material_id?: string
          price_per_kg?: number
          price_per_m2?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_prices_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          created_at: string
          endereco: string | null
          id: string
          nome: string
          responsavel: string | null
        }
        Insert: {
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          responsavel?: string | null
        }
        Update: {
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          responsavel?: string | null
        }
        Relationships: []
      }
      operadores: {
        Row: {
          created_at: string
          especialidade: string | null
          id: string
          nome: string
          turno: string
        }
        Insert: {
          created_at?: string
          especialidade?: string | null
          id?: string
          nome: string
          turno: string
        }
        Update: {
          created_at?: string
          especialidade?: string | null
          id?: string
          nome?: string
          turno?: string
        }
        Relationships: []
      }
      perfis_materiais: {
        Row: {
          created_at: string
          descricao_perfil: string
          id: string
          kg_por_metro: number
          tipo_perfil: string
        }
        Insert: {
          created_at?: string
          descricao_perfil: string
          id?: string
          kg_por_metro: number
          tipo_perfil: string
        }
        Update: {
          created_at?: string
          descricao_perfil?: string
          id?: string
          kg_por_metro?: number
          tipo_perfil?: string
        }
        Relationships: []
      }
      projeto_otimizacoes: {
        Row: {
          created_at: string
          id: string
          nome_lista: string
          pecas_selecionadas: Json
          perfil_id: string | null
          projeto_id: string
          resultados: Json | null
          tamanho_barra: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome_lista: string
          pecas_selecionadas?: Json
          perfil_id?: string | null
          projeto_id: string
          resultados?: Json | null
          tamanho_barra: number
        }
        Update: {
          created_at?: string
          id?: string
          nome_lista?: string
          pecas_selecionadas?: Json
          perfil_id?: string | null
          projeto_id?: string
          resultados?: Json | null
          tamanho_barra?: number
        }
        Relationships: [
          {
            foreignKeyName: "projeto_otimizacoes_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_otimizacoes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_pecas: {
        Row: {
          comprimento_mm: number
          conjunto: string | null
          created_at: string
          descricao_perfil_raw: string | null
          id: string
          perfil_id: string | null
          perfil_nao_encontrado: boolean
          peso: number | null
          peso_por_metro: number | null
          posicao: string
          projeto_id: string
          quantidade: number
          tag: string | null
        }
        Insert: {
          comprimento_mm: number
          conjunto?: string | null
          created_at?: string
          descricao_perfil_raw?: string | null
          id?: string
          perfil_id?: string | null
          perfil_nao_encontrado?: boolean
          peso?: number | null
          peso_por_metro?: number | null
          posicao: string
          projeto_id: string
          quantidade?: number
          tag?: string | null
        }
        Update: {
          comprimento_mm?: number
          conjunto?: string | null
          created_at?: string
          descricao_perfil_raw?: string | null
          id?: string
          perfil_id?: string | null
          perfil_nao_encontrado?: boolean
          peso?: number | null
          peso_por_metro?: number | null
          posicao?: string
          projeto_id?: string
          quantidade?: number
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projeto_pecas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_pecas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          cliente_id: string | null
          created_at: string
          id: string
          nome: string
          numero_projeto: string
          obra_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          nome: string
          numero_projeto: string
          obra_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          numero_projeto?: string
          obra_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_optimization_history: {
        Row: {
          algorithm: string
          created_at: string
          efficiency: number
          id: string
          material_cost: number
          optimization_time: number
          pieces: Json
          project_id: string
          project_name: string
          results: Json
          total_sheets: number
          total_weight: number
        }
        Insert: {
          algorithm?: string
          created_at?: string
          efficiency?: number
          id?: string
          material_cost?: number
          optimization_time?: number
          pieces: Json
          project_id: string
          project_name: string
          results: Json
          total_sheets?: number
          total_weight?: number
        }
        Update: {
          algorithm?: string
          created_at?: string
          efficiency?: number
          id?: string
          material_cost?: number
          optimization_time?: number
          pieces?: Json
          project_id?: string
          project_name?: string
          results?: Json
          total_sheets?: number
          total_weight?: number
        }
        Relationships: []
      }
      system_activity_logs: {
        Row: {
          action_type: string
          created_at: string | null
          description: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          session_id: string | null
          timestamp: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      tamanhos_barras: {
        Row: {
          comprimento: number
          created_at: string
          descricao: string | null
          id: string
          is_default: boolean
        }
        Insert: {
          comprimento: number
          created_at?: string
          descricao?: string | null
          id?: string
          is_default?: boolean
        }
        Update: {
          comprimento?: number
          created_at?: string
          descricao?: string | null
          id?: string
          is_default?: boolean
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nome: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          nome: string
          role?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          user_name: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
