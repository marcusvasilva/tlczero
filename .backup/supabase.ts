// Re-export from supabaseConfig
export { supabaseClient as supabase } from './supabaseConfig'
export { handleAuthError } from './supabaseConfig'

// Types for the database
export type Database = {
  public: {
    Tables: {
      barbershops: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          address: string | null
          phone: string | null
          email: string | null
          primary_color: string | null
          secondary_color: string | null
          created_at: string
        }
        Insert: Omit<Row, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Insert>
      }
      profiles: {
        Row: {
          id: string
          barbershop_id: string | null
          full_name: string | null
          role: 'admin' | 'barber' | 'receptionist' | 'superadmin' | null
          created_at: string
        }
        Insert: Omit<Row, 'created_at'> & {
          created_at?: string
        }
        Update: Partial<Insert>
      }
      barbers: {
        Row: {
          id: string
          barbershop_id: string | null
          user_id: string | null
          name: string
          email: string | null
          phone: string | null
          photo_url: string | null
          specialties: string[] | null
          is_active: boolean | null
          created_at: string
        }
        Insert: Omit<Row, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Insert>
      }
      customers: {
        Row: {
          id: string
          barbershop_id: string | null
          name: string
          email: string | null
          phone: string
          cpf: string | null
          birth_date: string | null
          preferred_barber_id: string | null
          notes: string | null
          created_at: string
          last_visit: string | null
        }
        Insert: Omit<Row, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Insert>
      }
      services: {
        Row: {
          id: string
          barbershop_id: string | null
          name: string
          description: string | null
          price: number
          duration: number
          is_active: boolean | null
          created_at: string
        }
        Insert: Omit<Row, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Insert>
      }
      appointments: {
        Row: {
          id: string
          barbershop_id: string | null
          barber_id: string | null
          customer_id: string | null
          service_id: string | null
          date: string
          start_time: string
          end_time: string
          status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' | null
          price: number | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Row, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Insert>
      }
      barbershop_settings: {
        Row: {
          id: string
          barbershop_id: string | null
          business_hours: any | null
          slot_duration: number | null
          booking_advance_days: number | null
          cancellation_deadline_hours: number | null
          updated_at: string
        }
        Insert: Omit<Row, 'id' | 'updated_at'> & {
          id?: string
          updated_at?: string
        }
        Update: Partial<Insert>
      }
      barber_commissions: {
        Row: {
          id: string
          barbershop_id: string | null
          barber_id: string | null
          commission_type: 'percentage' | 'fixed' | null
          commission_value: number | null
          active_from: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Row, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Insert>
      }
    }
    Views: {
      customer_stats: {
        Row: {
          id: string
          barbershop_id: string
          total_visits: number
          total_spent: number
        }
      }
    }
  }
}

type Row = Database['public']['Tables'][keyof Database['public']['Tables']]['Row']
type Insert = Database['public']['Tables'][keyof Database['public']['Tables']]['Insert']
// Removed unused Update type