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
      shopkeepers: {
        Row: {
          id: string
          name: string
          mobileNumber: string | null
          address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          mobileNumber?: string | null
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          mobileNumber?: string | null
          address?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          shopkeeperId: string
          date: string
          goodsGiven: number
          moneyReceived: number
          created_at: string
        }
        Insert: {
          id?: string
          shopkeeperId: string
          date: string
          goodsGiven: number
          moneyReceived: number
          created_at?: string
        }
        Update: {
          id?: string
          shopkeeperId?: string
          date?: string
          goodsGiven?: number
          moneyReceived?: number
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
  }
}
