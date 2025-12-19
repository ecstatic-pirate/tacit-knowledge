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
      calendar_connections: {
        Row: {
          access_token: string
          calendar_email: string | null
          calendar_id: string | null
          created_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          token_expires_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_email?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          token_expires_at: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_email?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          capture_mode: string | null
          completed_at: string | null
          completed_sessions: number | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          department: string | null
          expert_email: string | null
          expert_name: string
          expert_role: string
          goal: string | null
          id: string
          org_id: string
          progress: number | null
          started_at: string | null
          status: string | null
          total_sessions: number | null
          updated_at: string | null
          updated_by: string | null
          years_experience: number | null
        }
        Insert: {
          capture_mode?: string | null
          completed_at?: string | null
          completed_sessions?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          department?: string | null
          expert_email?: string | null
          expert_name: string
          expert_role: string
          goal?: string | null
          id?: string
          org_id: string
          progress?: number | null
          started_at?: string | null
          status?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          updated_by?: string | null
          years_experience?: number | null
        }
        Update: {
          capture_mode?: string | null
          completed_at?: string | null
          completed_sessions?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          department?: string | null
          expert_email?: string | null
          expert_name?: string
          expert_role?: string
          goal?: string | null
          id?: string
          org_id?: string
          progress?: number | null
          started_at?: string | null
          status?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          updated_by?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      captured_insights: {
        Row: {
          campaign_id: string
          confidence: number | null
          created_at: string | null
          deleted_at: string | null
          id: string
          insight: string
          session_id: string
          source_transcript_ids: string[] | null
          title: string
        }
        Insert: {
          campaign_id: string
          confidence?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          insight: string
          session_id: string
          source_transcript_ids?: string[] | null
          title: string
        }
        Update: {
          campaign_id?: string
          confidence?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          insight?: string
          session_id?: string
          source_transcript_ids?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "captured_insights_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captured_insights_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_processed: boolean | null
          ai_processed_at: string | null
          campaign_id: string | null
          created_at: string | null
          deleted_at: string | null
          extracted_skills: Json | null
          file_size: number | null
          file_type: string | null
          filename: string
          id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          ai_processed?: boolean | null
          ai_processed_at?: string | null
          campaign_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          extracted_skills?: Json | null
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          ai_processed?: boolean | null
          ai_processed_at?: string | null
          campaign_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          extracted_skills?: Json | null
          file_size?: number | null
          file_type?: string | null
          filename?: string
          id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_edges: {
        Row: {
          campaign_id: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string
          metadata: Json | null
          relationship: string
          session_id: string | null
          source_node_id: string
          target_node_id: string
          weight: number | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          metadata?: Json | null
          relationship: string
          session_id?: string | null
          source_node_id: string
          target_node_id: string
          weight?: number | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          metadata?: Json | null
          relationship?: string
          session_id?: string | null
          source_node_id?: string
          target_node_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_edges_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_edges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_edges_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_nodes: {
        Row: {
          campaign_id: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          label: string
          metadata: Json | null
          position_x: number | null
          position_y: number | null
          session_id: string | null
          skill_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          label: string
          metadata?: Json | null
          position_x?: number | null
          position_y?: number | null
          session_id?: string | null
          skill_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          label?: string
          metadata?: Json | null
          position_x?: number | null
          position_y?: number | null
          session_id?: string | null
          skill_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_nodes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_nodes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_nodes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_nodes_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          file_url: string | null
          id: string
          metadata: Json | null
          preview: string | null
          session_id: string | null
          status: string | null
          title: string
          type: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          preview?: string | null
          session_id?: string | null
          status?: string | null
          title: string
          type: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          preview?: string | null
          session_id?: string | null
          status?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          calendar_event_id: string | null
          calendar_provider: string | null
          campaign_id: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          notes: string | null
          recording_url: string | null
          scheduled_at: string | null
          session_number: number
          started_at: string | null
          status: string | null
          topics: string[] | null
          transcript_url: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          calendar_event_id?: string | null
          calendar_provider?: string | null
          campaign_id: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          recording_url?: string | null
          scheduled_at?: string | null
          session_number: number
          started_at?: string | null
          status?: string | null
          topics?: string[] | null
          transcript_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          calendar_event_id?: string | null
          calendar_provider?: string | null
          campaign_id?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          recording_url?: string | null
          scheduled_at?: string | null
          session_number?: number
          started_at?: string | null
          status?: string | null
          topics?: string[] | null
          transcript_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          campaign_id: string
          captured: boolean | null
          captured_at: string | null
          category: string | null
          confidence: number | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          session_id: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          captured?: boolean | null
          captured_at?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          session_id?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          captured?: boolean | null
          captured_at?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          session_id?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          campaign_id: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          deleted_at: string | null
          due_at: string | null
          id: string
          org_id: string
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          campaign_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          org_id: string
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          campaign_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          org_id?: string
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_lines: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          is_final: boolean | null
          session_id: string
          speaker: string
          text: string
          timestamp_seconds: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_final?: boolean | null
          session_id: string
          speaker?: string
          text: string
          timestamp_seconds?: number
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_final?: boolean | null
          session_id?: string
          speaker?: string
          text?: string
          timestamp_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "transcript_lines_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          full_name: string | null
          id: string
          org_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          full_name?: string | null
          id: string
          org_id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          org_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_campaign: { Args: { campaign_uuid: string }; Returns: boolean }
      get_user_org_id: { Args: Record<PropertyKey, never>; Returns: string }
      get_user_role: { Args: Record<PropertyKey, never>; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience type aliases
export type Organization = Tables<'organizations'>
export type User = Tables<'users'>
export type Campaign = Tables<'campaigns'>
export type Session = Tables<'sessions'>
export type Skill = Tables<'skills'>
export type Task = Tables<'tasks'>
export type Report = Tables<'reports'>
export type Document = Tables<'documents'>
export type GraphNode = Tables<'graph_nodes'>
export type GraphEdge = Tables<'graph_edges'>
export type CalendarConnection = Tables<'calendar_connections'>
export type TranscriptLine = Tables<'transcript_lines'>
export type CapturedInsight = Tables<'captured_insights'>

// Insert types
export type OrganizationInsert = TablesInsert<'organizations'>
export type UserInsert = TablesInsert<'users'>
export type CampaignInsert = TablesInsert<'campaigns'>
export type SessionInsert = TablesInsert<'sessions'>
export type SkillInsert = TablesInsert<'skills'>
export type TaskInsert = TablesInsert<'tasks'>
export type ReportInsert = TablesInsert<'reports'>
export type DocumentInsert = TablesInsert<'documents'>
export type GraphNodeInsert = TablesInsert<'graph_nodes'>
export type GraphEdgeInsert = TablesInsert<'graph_edges'>
export type CalendarConnectionInsert = TablesInsert<'calendar_connections'>
export type TranscriptLineInsert = TablesInsert<'transcript_lines'>
export type CapturedInsightInsert = TablesInsert<'captured_insights'>

// Update types
export type OrganizationUpdate = TablesUpdate<'organizations'>
export type UserUpdate = TablesUpdate<'users'>
export type CampaignUpdate = TablesUpdate<'campaigns'>
export type SessionUpdate = TablesUpdate<'sessions'>
export type SkillUpdate = TablesUpdate<'skills'>
export type TaskUpdate = TablesUpdate<'tasks'>
export type ReportUpdate = TablesUpdate<'reports'>
export type DocumentUpdate = TablesUpdate<'documents'>
export type GraphNodeUpdate = TablesUpdate<'graph_nodes'>
export type GraphEdgeUpdate = TablesUpdate<'graph_edges'>
export type CalendarConnectionUpdate = TablesUpdate<'calendar_connections'>
export type TranscriptLineUpdate = TablesUpdate<'transcript_lines'>
export type CapturedInsightUpdate = TablesUpdate<'captured_insights'>
