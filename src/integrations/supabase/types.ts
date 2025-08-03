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
      ai_comments: {
        Row: {
          created_at: string
          emotion_used: string | null
          generated_comment: string
          id: string
          is_posted: boolean | null
          posted_at: string | null
          reddit_post_id: string
          user_id: string
          word_count_used: number | null
        }
        Insert: {
          created_at?: string
          emotion_used?: string | null
          generated_comment: string
          id?: string
          is_posted?: boolean | null
          posted_at?: string | null
          reddit_post_id: string
          user_id: string
          word_count_used?: number | null
        }
        Update: {
          created_at?: string
          emotion_used?: string | null
          generated_comment?: string
          id?: string
          is_posted?: boolean | null
          posted_at?: string | null
          reddit_post_id?: string
          user_id?: string
          word_count_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ai_comments_reddit_post_id"
            columns: ["reddit_post_id"]
            isOneToOne: false
            referencedRelation: "reddit_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      contexts: {
        Row: {
          context: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reddit_accounts: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          reddit_username: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reddit_username: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reddit_username?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reddit_posts: {
        Row: {
          author: string
          content: string | null
          created_at: string
          fetched_at: string
          id: string
          reddit_post_id: string
          score: number | null
          signal_id: string
          subreddit: string
          title: string
          url: string
        }
        Insert: {
          author: string
          content?: string | null
          created_at?: string
          fetched_at?: string
          id?: string
          reddit_post_id: string
          score?: number | null
          signal_id: string
          subreddit: string
          title: string
          url: string
        }
        Update: {
          author?: string
          content?: string | null
          created_at?: string
          fetched_at?: string
          id?: string
          reddit_post_id?: string
          score?: number | null
          signal_id?: string
          subreddit?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reddit_posts_signal_id"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_signals: {
        Row: {
          created_at: string
          frequency_hours: number
          id: string
          is_active: boolean
          last_run: string | null
          next_run: string
          signal_id: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency_hours: number
          id?: string
          is_active?: boolean
          last_run?: string | null
          next_run: string
          signal_id: string
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency_hours?: number
          id?: string
          is_active?: boolean
          last_run?: string | null
          next_run?: string
          signal_id?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_scheduled_signals_signal_id"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          created_at: string
          id: string
          keywords: string[]
          name: string
          status: string
          subreddit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          keywords: string[]
          name: string
          status?: string
          subreddit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          keywords?: string[]
          name?: string
          status?: string
          subreddit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_prompts: {
        Row: {
          created_at: string
          id: string
          max_delay_seconds: number | null
          max_number: number | null
          min_delay_seconds: number | null
          min_number: number | null
          prompt: string
          signal_id: string
          tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_delay_seconds?: number | null
          max_number?: number | null
          min_delay_seconds?: number | null
          min_number?: number | null
          prompt?: string
          signal_id: string
          tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_delay_seconds?: number | null
          max_number?: number | null
          min_delay_seconds?: number | null
          min_number?: number | null
          prompt?: string
          signal_id?: string
          tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_prompts_signal_id"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_signals_with_stats: {
        Args: { user_id_param: string }
        Returns: {
          id: string
          user_id: string
          name: string
          subreddit: string
          keywords: string[]
          status: string
          created_at: string
          updated_at: string
          generated_count: number
          posted_count: number
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
