export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
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
      campaign_access_tokens: {
        Row: {
          campaign_id: string
          created_at: string | null
          draft_data: Json | null
          email: string
          expires_at: string
          id: string
          name: string | null
          role: string | null
          submitted_at: string | null
          token: string
          token_type: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          draft_data?: Json | null
          email: string
          expires_at: string
          id?: string
          name?: string | null
          role?: string | null
          submitted_at?: string | null
          token: string
          token_type: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          draft_data?: Json | null
          email?: string
          expires_at?: string
          id?: string
          name?: string | null
          role?: string | null
          submitted_at?: string | null
          token?: string
          token_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_access_tokens_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ai_suggested_domains: Json | null
          capture_cadence: string | null
          capture_mode: string | null
          capture_schedule: string | null
          collaborators: Json | null
          completed_at: string | null
          completed_sessions: number | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          department: string | null
          expert_email: string | null
          expert_name: string
          expert_role: string
          focus_areas: Json | null
          goal: string | null
          id: string
          interview_format: string | null
          interviewer_guide_token: string | null
          org_id: string
          progress: number | null
          project_id: string | null
          project_type: string | null
          self_assessment: Json | null
          started_at: string | null
          status: string | null
          subject_type: string | null
          team_id: string | null
          total_sessions: number | null
          updated_at: string | null
          updated_by: string | null
          years_experience: number | null
        }
        Insert: {
          ai_suggested_domains?: Json | null
          capture_cadence?: string | null
          capture_mode?: string | null
          capture_schedule?: string | null
          collaborators?: Json | null
          completed_at?: string | null
          completed_sessions?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          department?: string | null
          expert_email?: string | null
          expert_name: string
          expert_role: string
          focus_areas?: Json | null
          goal?: string | null
          id?: string
          interview_format?: string | null
          interviewer_guide_token?: string | null
          org_id: string
          progress?: number | null
          project_id?: string | null
          project_type?: string | null
          self_assessment?: Json | null
          started_at?: string | null
          status?: string | null
          subject_type?: string | null
          team_id?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          updated_by?: string | null
          years_experience?: number | null
        }
        Update: {
          ai_suggested_domains?: Json | null
          capture_cadence?: string | null
          capture_mode?: string | null
          capture_schedule?: string | null
          collaborators?: Json | null
          completed_at?: string | null
          completed_sessions?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          department?: string | null
          expert_email?: string | null
          expert_name?: string
          expert_role?: string
          focus_areas?: Json | null
          goal?: string | null
          id?: string
          interview_format?: string | null
          interviewer_guide_token?: string | null
          org_id?: string
          progress?: number | null
          project_id?: string | null
          project_type?: string | null
          self_assessment?: Json | null
          started_at?: string | null
          status?: string | null
          subject_type?: string | null
          team_id?: string | null
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
            foreignKeyName: "campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
      collaborator_responses: {
        Row: {
          additional_notes: string | null
          campaign_id: string
          collaborator_email: string
          collaborator_name: string
          collaborator_role: string
          created_at: string | null
          id: string
          specific_questions: string[] | null
          submitted_at: string | null
          token_id: string
          updated_at: string | null
          what_they_ask_about: string[] | null
          what_will_be_hard: string | null
          wish_was_documented: string | null
        }
        Insert: {
          additional_notes?: string | null
          campaign_id: string
          collaborator_email: string
          collaborator_name: string
          collaborator_role: string
          created_at?: string | null
          id?: string
          specific_questions?: string[] | null
          submitted_at?: string | null
          token_id: string
          updated_at?: string | null
          what_they_ask_about?: string[] | null
          what_will_be_hard?: string | null
          wish_was_documented?: string | null
        }
        Update: {
          additional_notes?: string | null
          campaign_id?: string
          collaborator_email?: string
          collaborator_name?: string
          collaborator_role?: string
          created_at?: string | null
          id?: string
          specific_questions?: string[] | null
          submitted_at?: string | null
          token_id?: string
          updated_at?: string | null
          what_they_ask_about?: string[] | null
          what_will_be_hard?: string | null
          wish_was_documented?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_responses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborator_responses_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "campaign_access_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_conversations: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          org_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          org_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          org_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          sources: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          sources?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "concierge_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "concierge_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_analysis: Json | null
          ai_processed: boolean | null
          ai_processed_at: string | null
          campaign_id: string | null
          created_at: string | null
          deleted_at: string | null
          extracted_skills: Json | null
          extracted_text: string | null
          file_size: number | null
          file_type: string | null
          filename: string
          id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_processed?: boolean | null
          ai_processed_at?: string | null
          campaign_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          extracted_skills?: Json | null
          extracted_text?: string | null
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_processed?: boolean | null
          ai_processed_at?: string | null
          campaign_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          extracted_skills?: Json | null
          extracted_text?: string | null
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
      email_reminders: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          reminder_type: string
          resend_message_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: string
          token_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          reminder_type: string
          resend_message_id?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: string
          token_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          reminder_type?: string
          resend_message_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_reminders_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "campaign_access_tokens"
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
          coverage_status: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          label: string
          metadata: Json | null
          position_x: number | null
          position_y: number | null
          project_id: string | null
          session_id: string | null
          skill_id: string | null
          team_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          coverage_status?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          label: string
          metadata?: Json | null
          position_x?: number | null
          position_y?: number | null
          project_id?: string | null
          session_id?: string | null
          skill_id?: string | null
          team_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          coverage_status?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          label?: string
          metadata?: Json | null
          position_x?: number | null
          position_y?: number | null
          project_id?: string | null
          session_id?: string | null
          skill_id?: string | null
          team_id?: string | null
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
            foreignKeyName: "graph_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          {
            foreignKeyName: "graph_nodes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_plans: {
        Row: {
          campaign_id: string
          context_summary: string | null
          created_at: string | null
          gaps_identified: Json | null
          generation_model: string | null
          id: string
          questions: Json | null
          topics_covered: Json | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          context_summary?: string | null
          created_at?: string | null
          gaps_identified?: Json | null
          generation_model?: string | null
          id?: string
          questions?: Json | null
          topics_covered?: Json | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          context_summary?: string | null
          created_at?: string | null
          gaps_identified?: Json | null
          generation_model?: string | null
          id?: string
          questions?: Json | null
          topics_covered?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_plans_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_embeddings: {
        Row: {
          campaign_id: string | null
          chunk_index: number
          chunk_text: string
          content_id: string
          content_type: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          org_id: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          chunk_index?: number
          chunk_text: string
          content_id: string
          content_type: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          org_id: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          chunk_index?: number
          chunk_text?: string
          content_id?: string
          content_type?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_embeddings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_embeddings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      projects: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          org_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          ai_suggested_topics: Json | null
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
          room_url: string | null
          scheduled_at: string | null
          session_number: number
          started_at: string | null
          status: string | null
          title: string | null
          topics: string[] | null
          transcript_url: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ai_suggested_topics?: Json | null
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
          room_url?: string | null
          scheduled_at?: string | null
          session_number: number
          started_at?: string | null
          status?: string | null
          title?: string | null
          topics?: string[] | null
          transcript_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ai_suggested_topics?: Json | null
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
          room_url?: string | null
          scheduled_at?: string | null
          session_number?: number
          started_at?: string | null
          status?: string | null
          title?: string | null
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
      teams: {
        Row: {
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          org_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_org_id_fkey"
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
      create_campaign_tokens: {
        Args: {
          p_campaign_id: string
          p_collaborators?: Json
          p_expert_email: string
          p_expert_name: string
        }
        Returns: {
          campaign_id: string
          created_at: string | null
          draft_data: Json | null
          email: string
          expires_at: string
          id: string
          name: string | null
          role: string | null
          submitted_at: string | null
          token: string
          token_type: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "campaign_access_tokens"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      generate_secure_token: { Args: never; Returns: string }
      get_user_org_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      schedule_token_reminders: {
        Args: { p_token_id: string }
        Returns: undefined
      }
      search_knowledge: {
        Args: {
          filter_campaign_id?: string
          filter_content_types?: string[]
          filter_org_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          campaign_id: string
          chunk_text: string
          content_id: string
          content_type: string
          id: string
          metadata: Json
          similarity: number
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

// Helper types for common use
export type Campaign = Tables<'campaigns'>
export type User = Tables<'users'>
export type Organization = Tables<'organizations'>
export type Task = Tables<'tasks'>
export type Session = Tables<'sessions'>
export type Skill = Tables<'skills'>
export type Document = Tables<'documents'>
export type Team = Tables<'teams'>
export type Project = Tables<'projects'>
export type GraphNode = Tables<'graph_nodes'>
export type GraphEdge = Tables<'graph_edges'>
export interface SelfAssessment {
  what_you_know?: string;
  questions_people_ask?: string[];
  what_will_break?: string;
  topics_to_cover?: string[];
  doc_links?: string[];
}

// Custom types for AI and collaborator features
export type CampaignAccessToken = Tables<'campaign_access_tokens'>

export type CollaboratorResponse = Tables<'collaborator_responses'>

export interface CollaboratorSurveyData {
  what_they_ask_about?: string[];
  what_will_be_hard?: string;
  wish_was_documented?: string;
  specific_questions?: string[];
  additional_notes?: string;
}

export interface DocumentAnalysis {
  summary?: string;
  topics?: string[];
  gaps?: string[];
}

export interface InterviewQuestion {
  question: string;
  priority: 'high' | 'medium' | 'low';
  topic?: string;
  category?: string;
  relatedGap?: string;
}
