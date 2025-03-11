
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      prompt_tags: {
        Row: {
          prompt_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          prompt_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          prompt_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      prompt_versions: {
        Row: {
          id: string
          prompt_id: string
          content: string
          version: number
          created_at: string
        }
        Insert: {
          id?: string
          prompt_id: string
          content: string
          version: number
          created_at?: string
        }
        Update: {
          id?: string
          prompt_id?: string
          content?: string
          version?: number
          created_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          collection_id: string | null
          is_favorite: boolean
          is_private: boolean
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          collection_id?: string | null
          is_favorite?: boolean
          is_private?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          collection_id?: string | null
          is_favorite?: boolean
          is_private?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
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
