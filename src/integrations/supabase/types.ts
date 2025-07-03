export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          disponivel: boolean
          id: string
          localizacao: string
          material_id: string | null
          projeto_origem: string | null
          quantidade: number
        }
        Insert: {
          comprimento: number
          created_at?: string
          disponivel?: boolean
          id?: string
          localizacao: string
          material_id?: string | null
          projeto_origem?: string | null
          quantidade?: number
        }
        Update: {
          comprimento?: number
          created_at?: string
          disponivel?: boolean
          id?: string
          localizacao?: string
          material_id?: string | null
          projeto_origem?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "estoque_sobras_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_sobras_projeto_origem_fkey"
            columns: ["projeto_origem"]
            isOneToOne: false
            referencedRelation: "projetos"
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
        }
        Insert: {
          comprimento_padrao?: number
          created_at?: string
          descricao?: string | null
          id?: string
          tipo: string
        }
        Update: {
          comprimento_padrao?: number
          created_at?: string
          descricao?: string | null
          id?: string
          tipo?: string
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
      projetos: {
        Row: {
          cliente_id: string | null
          created_at: string
          dados_projeto: Json | null
          enviar_sobras_estoque: boolean
          id: string
          inspetor_id: string | null
          lista: string
          material_id: string | null
          nome: string
          numero_projeto: string
          obra_id: string | null
          operador_id: string | null
          qr_code: string | null
          revisao: string
          turno: string
          validacao_qa: boolean
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          dados_projeto?: Json | null
          enviar_sobras_estoque?: boolean
          id?: string
          inspetor_id?: string | null
          lista?: string
          material_id?: string | null
          nome: string
          numero_projeto: string
          obra_id?: string | null
          operador_id?: string | null
          qr_code?: string | null
          revisao?: string
          turno: string
          validacao_qa?: boolean
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          dados_projeto?: Json | null
          enviar_sobras_estoque?: boolean
          id?: string
          inspetor_id?: string | null
          lista?: string
          material_id?: string | null
          nome?: string
          numero_projeto?: string
          obra_id?: string | null
          operador_id?: string | null
          qr_code?: string | null
          revisao?: string
          turno?: string
          validacao_qa?: boolean
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
            foreignKeyName: "projetos_inspetor_id_fkey"
            columns: ["inspetor_id"]
            isOneToOne: false
            referencedRelation: "inspetores_qa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "operadores"
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
