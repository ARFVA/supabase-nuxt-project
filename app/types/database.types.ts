/**
 * Tipe database Supabase untuk project ini.
 *
 * File ini dibaca OTOMATIS oleh modul @nuxtjs/supabase
 * (konfigurasi types: `~/types/database.types.ts`) dan menggantikan
 * fallback `Database = unknown` — sehingga semua query Supabase
 * (client maupun server) bertipe penuh.
 *
 * Shape mengikuti output `supabase gen types --lang=typescript`
 * untuk PostgREST v12 (supabase-js 2.117.x).
 *
 * Jika kolom tabel berubah di database, perbarui file ini
 * (atau generate ulang via Supabase CLI).
 */
export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          address: string | null
          role: string
          is_active: boolean
          photo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone?: string | null
          address?: string | null
          role?: string
          is_active?: boolean
          photo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          address?: string | null
          role?: string
          is_active?: boolean
          photo_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          is_active: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: string
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_import_jobs: {
        Row: {
          id: string
          created_by: string
          object_path: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          total_rows: number | null
          imported_rows: number | null
          error_message: string | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          created_by: string
          object_path: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          total_rows?: number | null
          imported_rows?: number | null
          error_message?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          created_by?: string
          object_path?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          total_rows?: number | null
          imported_rows?: number | null
          error_message?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: Record<string, never>
  }
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
}
