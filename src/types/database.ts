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
      accounts: {
        Row: {
          address: string | null
          cep: string | null
          city: string | null
          cnpj: string | null
          company_name: string
          contact_person: string
          created_at: string | null
          email: string | null
          id: string
          phone: string
          state: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          company_name: string
          contact_person: string
          created_at?: string | null
          email?: string | null
          id?: string
          phone: string
          state?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string
          contact_person?: string
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string
          state?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      collections: {
        Row: {
          collection_date: string
          created_at: string | null
          humidity: number | null
          id: string
          notes: string | null
          photo_url: string | null
          space_id: string
          temperature: number | null
          updated_at: string | null
          user_id: string
          weight_collected: number
        }
        Insert: {
          collection_date?: string
          created_at?: string | null
          humidity?: number | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          space_id: string
          temperature?: number | null
          updated_at?: string | null
          user_id: string
          weight_collected: number
        }
        Update: {
          collection_date?: string
          created_at?: string | null
          humidity?: number | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          space_id?: string
          temperature?: number | null
          updated_at?: string | null
          user_id?: string
          weight_collected?: number
        }
        Relationships: [
          {
            foreignKeyName: "collections_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          account_id: string
          avatar_url: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          hire_date: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operators_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          account_id: string
          created_at: string | null
          end_date: string
          generated_at: string | null
          id: string
          report_type: string
          space_id: string | null
          start_date: string
          total_collections: number | null
          total_weight: number | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          end_date: string
          generated_at?: string | null
          id?: string
          report_type?: string
          space_id?: string | null
          start_date: string
          total_collections?: number | null
          total_weight?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          end_date?: string
          generated_at?: string | null
          id?: string
          report_type?: string
          space_id?: string | null
          start_date?: string
          total_collections?: number | null
          total_weight?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          account_id: string
          area_size: number | null
          created_at: string | null
          description: string | null
          environment_type: string | null
          id: string
          name: string
          public_token: string
          qr_code_enabled: boolean
          status: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          area_size?: number | null
          created_at?: string | null
          description?: string | null
          environment_type?: string | null
          id?: string
          name: string
          public_token?: string
          qr_code_enabled?: boolean
          status?: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          area_size?: number | null
          created_at?: string | null
          description?: string | null
          environment_type?: string | null
          id?: string
          name?: string
          public_token?: string
          qr_code_enabled?: boolean
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spaces_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_id: string | null
          cpf: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: string
          status: string | null
          supervisor_id: string | null
          updated_at: string | null
          password_change_required: boolean | null
        }
        Insert: {
          account_id?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          role?: string
          status?: string | null
          supervisor_id?: string | null
          updated_at?: string | null
          password_change_required?: boolean | null
        }
        Update: {
          account_id?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string
          status?: string | null
          supervisor_id?: string | null
          updated_at?: string | null
          password_change_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "users_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_collections: {
        Row: {
          id: string
          space_id: string
          weight_collected: number
          photo_url: string | null
          notes: string | null
          collection_date: string
          collection_time: string
          device_info: Json | null
          ip_address: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          space_id: string
          weight_collected: number
          photo_url?: string | null
          notes?: string | null
          collection_date?: string
          collection_time?: string
          device_info?: Json | null
          ip_address?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          space_id?: string
          weight_collected?: number
          photo_url?: string | null
          notes?: string | null
          collection_date?: string
          collection_time?: string
          device_info?: Json | null
          ip_address?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_collections_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      monthly_statistics: {
        Row: {
          active_clients: number | null
          active_spaces: number | null
          avg_weight: number | null
          month: string | null
          total_collections: number | null
          total_weight: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_orphaned_auth_users: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      execute_sql: {
        Args: { query: string }
        Returns: Json
      }
      generate_monthly_report: {
        Args: { client_uuid: string; report_month: string }
        Returns: string
      }
      get_client_collections_count: {
        Args: { client_uuid: string; start_date: string; end_date: string }
        Returns: number
      }
      get_client_total_weight: {
        Args: { client_uuid: string; start_date: string; end_date: string }
        Returns: number
      }
      get_space_effectiveness: {
        Args: { space_uuid: string; start_date: string; end_date: string }
        Returns: number
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