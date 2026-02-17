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
          departure_date: string | null
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
          session_duration: number | null
          sessions_generation_error: string | null
          sessions_generation_started_at: string | null
          sessions_generation_status: string | null
          started_at: string | null
          status: string | null
          subject_type: string | null
          team_id: string | null
          topics_generation_error: string | null
          topics_generation_started_at: string | null
          topics_generation_status: string | null
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
          departure_date?: string | null
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
          session_duration?: number | null
          sessions_generation_error?: string | null
          sessions_generation_started_at?: string | null
          sessions_generation_status?: string | null
          started_at?: string | null
          status?: string | null
          subject_type?: string | null
          team_id?: string | null
          topics_generation_error?: string | null
          topics_generation_started_at?: string | null
          topics_generation_status?: string | null
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
          departure_date?: string | null
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
          session_duration?: number | null
          sessions_generation_error?: string | null
          sessions_generation_started_at?: string | null
          sessions_generation_status?: string | null
          started_at?: string | null
          status?: string | null
          subject_type?: string | null
          team_id?: string | null
          topics_generation_error?: string | null
          topics_generation_started_at?: string | null
          topics_generation_status?: string | null
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
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
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
          source_excerpt: string | null
          source_transcript_line_ids: string[] | null
          team_id: string | null
          topic_id: string | null
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
          source_excerpt?: string | null
          source_transcript_line_ids?: string[] | null
          team_id?: string | null
          topic_id?: string | null
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
          source_excerpt?: string | null
          source_transcript_line_ids?: string[] | null
          team_id?: string | null
          topic_id?: string | null
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
          {
            foreignKeyName: "graph_nodes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
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
      knowledge_topic_coverage: {
        Row: {
          coverage_level: string | null
          created_at: string | null
          id: string
          knowledge_node_id: string
          session_id: string | null
          topic_id: string
        }
        Insert: {
          coverage_level?: string | null
          created_at?: string | null
          id?: string
          knowledge_node_id: string
          session_id?: string | null
          topic_id: string
        }
        Update: {
          coverage_level?: string | null
          created_at?: string | null
          id?: string
          knowledge_node_id?: string
          session_id?: string | null
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_topic_coverage_knowledge_node_id_fkey"
            columns: ["knowledge_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_topic_coverage_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_topic_coverage_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
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
      participant_survey_responses: {
        Row: {
          additional_notes: string | null
          areas_of_expertise: string[] | null
          campaign_id: string
          created_at: string | null
          id: string
          knowledge_to_capture: string | null
          participant_id: string
          questions_for_others: string[] | null
          submitted_at: string | null
          token_id: string
          updated_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          areas_of_expertise?: string[] | null
          campaign_id: string
          created_at?: string | null
          id?: string
          knowledge_to_capture?: string | null
          participant_id: string
          questions_for_others?: string[] | null
          submitted_at?: string | null
          token_id: string
          updated_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          areas_of_expertise?: string[] | null
          campaign_id?: string
          created_at?: string | null
          id?: string
          knowledge_to_capture?: string | null
          participant_id?: string
          questions_for_others?: string[] | null
          submitted_at?: string | null
          token_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_survey_responses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_survey_responses_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_survey_responses_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "campaign_access_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          campaign_id: string
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          role: string | null
          status: string
          survey_token: string | null
          team: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          role?: string | null
          status?: string
          survey_token?: string | null
          team?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          role?: string | null
          status?: string
          survey_token?: string | null
          team?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
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
      questions: {
        Row: {
          asked: boolean | null
          asked_at: string | null
          campaign_id: string
          category: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          priority: string | null
          session_id: string | null
          source: string
          text: string
          topic_id: string | null
          updated_at: string | null
        }
        Insert: {
          asked?: boolean | null
          asked_at?: string | null
          campaign_id: string
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          priority?: string | null
          session_id?: string | null
          source: string
          text: string
          topic_id?: string | null
          updated_at?: string | null
        }
        Update: {
          asked?: boolean | null
          asked_at?: string | null
          campaign_id?: string
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          priority?: string | null
          session_id?: string | null
          source?: string
          text?: string
          topic_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
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
          interviewer_email: string | null
          interviewer_name: string | null
          notes: string | null
          participant_id: string | null
          processing_completed_at: string | null
          processing_error: string | null
          processing_metrics: Json | null
          processing_started_at: string | null
          processing_status: string | null
          processing_steps_completed: Json | null
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
          interviewer_email?: string | null
          interviewer_name?: string | null
          notes?: string | null
          participant_id?: string | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_metrics?: Json | null
          processing_started_at?: string | null
          processing_status?: string | null
          processing_steps_completed?: Json | null
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
          interviewer_email?: string | null
          interviewer_name?: string | null
          notes?: string | null
          participant_id?: string | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_metrics?: Json | null
          processing_started_at?: string | null
          processing_status?: string | null
          processing_steps_completed?: Json | null
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
            foreignKeyName: "sessions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
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
      topics: {
        Row: {
          campaign_id: string
          captured: boolean | null
          captured_at: string | null
          category: string | null
          confidence: number | null
          coverage_status: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          session_id: string | null
          source: string | null
          suggested_by: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          captured?: boolean | null
          captured_at?: string | null
          category?: string | null
          confidence?: number | null
          coverage_status?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          session_id?: string | null
          source?: string | null
          suggested_by?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          captured?: boolean | null
          captured_at?: string | null
          category?: string | null
          confidence?: number | null
          coverage_status?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          session_id?: string | null
          source?: string | null
          suggested_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
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
      get_campaign_topic_coverage: {
        Args: { p_campaign_id: string }
        Returns: {
          captured_topics: number
          coverage_percentage: number
          mentioned_topics: number
          total_topics: number
        }[]
      }
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

// Custom type aliases for table rows
export type Document = Database['public']['Tables']['documents']['Row']
export type GraphNode = Database['public']['Tables']['graph_nodes']['Row']
export type GraphEdge = Database['public']['Tables']['graph_edges']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type Topic = Database['public']['Tables']['topics']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type CampaignAccessToken = Database['public']['Tables']['campaign_access_tokens']['Row']
export type CollaboratorResponse = Database['public']['Tables']['collaborator_responses']['Row']
export type Participant = Database['public']['Tables']['participants']['Row']

// Coverage level type (used in knowledge_topic_coverage junction table)
export type CoverageLevel = 'mentioned' | 'partial' | 'full'

// Topic coverage status (used in topics table)
export type TopicCoverageStatus = 'not_discussed' | 'mentioned' | 'partial' | 'full'

// Participant status type
export type ParticipantStatus = 'pending' | 'invited' | 'active' | 'completed' | 'not_interviewed' | 'in_progress' | 'complete'

// Self assessment structure (stored in campaigns.self_assessment JSON)
export interface SelfAssessment {
  what_you_know?: string
  questions_people_ask?: string[]
  what_will_break?: string
  topics_to_cover?: string[]
  doc_links?: string[]
}

// Collaborator survey data (stored in collaborator_responses)
export interface CollaboratorSurveyData {
  what_they_ask_about?: string[]
  what_will_be_hard?: string
  wish_was_documented?: string
  specific_questions?: string[]
  additional_notes?: string
}

// Manager survey data (stored in campaign_access_tokens.draft_data)
export interface ManagerSurveyData {
  suggested_topics?: Array<{
    name: string
    category?: string
    priority?: 'high' | 'medium' | 'low'
    reason?: string
  }>
  team_context?: string
  key_concerns?: string
  additional_notes?: string
}

// Interview question structure (stored in interview_plans.questions JSON)
export interface InterviewQuestion {
  question: string
  priority: 'high' | 'medium' | 'low'
  topic?: string
  category?: string
  relatedGap?: string
}
