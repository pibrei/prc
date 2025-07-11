import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logs removed

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storageKey: 'supabase.auth.token',
    storage: localStorage
  }
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'standard_user' | 'team_leader' | 'admin'
          full_name: string
          badge_number: string | null
          department: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'standard_user' | 'team_leader' | 'admin'
          full_name: string
          badge_number?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'standard_user' | 'team_leader' | 'admin'
          full_name?: string
          badge_number?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          name: string
          description: string | null
          address: string
          latitude: number
          longitude: number
          contact_name: string | null
          contact_phone: string | null
          contact_email: string | null
          property_type: 'rural' | 'urban' | 'mixed'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          address: string
          latitude: number
          longitude: number
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          property_type?: 'rural' | 'urban' | 'mixed'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          address?: string
          latitude?: number
          longitude?: number
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          property_type?: 'rural' | 'urban' | 'mixed'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          license_plate: string
          make: string | null
          model: string | null
          color: string | null
          year: number | null
          description: string | null
          suspicious_activity: string | null
          location_spotted: string | null
          latitude: number | null
          longitude: number | null
          spotted_at: string
          photo_url: string | null
          status: 'active' | 'resolved' | 'false_alarm'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          license_plate: string
          make?: string | null
          model?: string | null
          color?: string | null
          year?: number | null
          description?: string | null
          suspicious_activity?: string | null
          location_spotted?: string | null
          latitude?: number | null
          longitude?: number | null
          spotted_at?: string
          photo_url?: string | null
          status?: 'active' | 'resolved' | 'false_alarm'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          license_plate?: string
          make?: string | null
          model?: string | null
          color?: string | null
          year?: number | null
          description?: string | null
          suspicious_activity?: string | null
          location_spotted?: string | null
          latitude?: number | null
          longitude?: number | null
          spotted_at?: string
          photo_url?: string | null
          status?: 'active' | 'resolved' | 'false_alarm'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          timestamp: string
          user_id: string | null
          user_email: string | null
          action: string
          table_name: string
          record_id: string | null
          changes: any
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          timestamp?: string
          user_id?: string | null
          user_email?: string | null
          action: string
          table_name: string
          record_id?: string | null
          changes?: any
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          timestamp?: string
          user_id?: string | null
          user_email?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          changes?: any
          ip_address?: string | null
          user_agent?: string | null
        }
      }
    }
  }
}