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
      activity_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          service_type: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          service_type?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          service_type?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      client_requests: {
        Row: {
          assigned_to: string | null
          category_id: string | null
          client_id: string
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          priority: string | null
          project_id: string | null
          related_file_id: string | null
          reminder_sent: boolean
          request_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          client_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          related_file_id?: string | null
          reminder_sent?: boolean
          request_type: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          client_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          related_file_id?: string | null
          reminder_sent?: boolean
          request_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_requests_related_file_id_fkey"
            columns: ["related_file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_history: {
        Row: {
          contact_date: string
          contact_type: string
          content: string
          created_at: string
          created_by: string | null
          deal_id: string | null
          id: string
          lead_id: string | null
          subject: string | null
        }
        Insert: {
          contact_date?: string
          contact_type?: string
          content: string
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          subject?: string | null
        }
        Update: {
          contact_date?: string
          contact_type?: string
          content?: string
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_post_assignments: {
        Row: {
          ai_suggestions: Json | null
          assignment_date: string
          created_at: string
          id: string
          post_created: boolean
          team_member_id: string
        }
        Insert: {
          ai_suggestions?: Json | null
          assignment_date?: string
          created_at?: string
          id?: string
          post_created?: boolean
          team_member_id: string
        }
        Update: {
          ai_suggestions?: Json | null
          assignment_date?: string
          created_at?: string
          id?: string
          post_created?: boolean
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_post_assignments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          assigned_to: string | null
          created_at: string
          currency: string
          expected_close_date: string | null
          id: string
          lead_id: string | null
          next_step: string | null
          next_step_date: string | null
          notes: string | null
          probability: number | null
          stage: string
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          currency?: string
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          next_step?: string | null
          next_step_date?: string | null
          notes?: string | null
          probability?: number | null
          stage?: string
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          currency?: string
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          next_step?: string | null
          next_step_date?: string | null
          notes?: string | null
          probability?: number | null
          stage?: string
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      file_comments: {
        Row: {
          author_email: string | null
          author_name: string
          author_role: string
          content: string
          created_at: string
          file_id: string
          id: string
        }
        Insert: {
          author_email?: string | null
          author_name: string
          author_role?: string
          content: string
          created_at?: string
          file_id: string
          id?: string
        }
        Update: {
          author_email?: string | null
          author_name?: string
          author_role?: string
          content?: string
          created_at?: string
          file_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_comments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
        ]
      }
      file_folders: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      google_calendar_events: {
        Row: {
          google_event_id: string
          id: string
          last_synced_at: string
          local_entity_id: string
          local_entity_type: string
          user_id: string
        }
        Insert: {
          google_event_id: string
          id?: string
          last_synced_at?: string
          local_entity_id: string
          local_entity_type: string
          user_id: string
        }
        Update: {
          google_event_id?: string
          id?: string
          last_synced_at?: string
          local_entity_id?: string
          local_entity_type?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_integrations: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string
          id: string
          last_sync_at: string | null
          refresh_token: string
          sync_enabled: boolean
          sync_token: string | null
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          refresh_token: string
          sync_enabled?: boolean
          sync_token?: string | null
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          refresh_token?: string
          sync_enabled?: boolean
          sync_token?: string | null
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
          used_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      growth_campaigns: {
        Row: {
          budget: number
          code: string
          created_at: string
          created_by: string | null
          currency: string
          ends_on: string | null
          id: string
          name: string
          notes: string | null
          objective: string | null
          offer_code: string | null
          offer_value: number | null
          starts_on: string | null
          status: string
          target_segment: string | null
          updated_at: string
          utm_campaign: string | null
        }
        Insert: {
          budget?: number
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          ends_on?: string | null
          id?: string
          name: string
          notes?: string | null
          objective?: string | null
          offer_code?: string | null
          offer_value?: number | null
          starts_on?: string | null
          status?: string
          target_segment?: string | null
          updated_at?: string
          utm_campaign?: string | null
        }
        Update: {
          budget?: number
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          ends_on?: string | null
          id?: string
          name?: string
          notes?: string | null
          objective?: string | null
          offer_code?: string | null
          offer_value?: number | null
          starts_on?: string | null
          status?: string
          target_segment?: string | null
          updated_at?: string
          utm_campaign?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          booking_id: string | null
          channel: string
          error_message: string | null
          event_type: string
          external_event_id: string | null
          id: string
          idempotency_key: string
          lead_id: string | null
          payload: Json
          processed_at: string | null
          processing_started_at: string
          provider: string
          received_at: string
          status: string
        }
        Insert: {
          booking_id?: string | null
          channel: string
          error_message?: string | null
          event_type: string
          external_event_id?: string | null
          id?: string
          idempotency_key: string
          lead_id?: string | null
          payload?: Json
          processed_at?: string | null
          processing_started_at?: string
          provider: string
          received_at?: string
          status?: string
        }
        Update: {
          booking_id?: string | null
          channel?: string
          error_message?: string | null
          event_type?: string
          external_event_id?: string | null
          id?: string
          idempotency_key?: string
          lead_id?: string | null
          payload?: Json
          processed_at?: string | null
          processing_started_at?: string
          provider?: string
          received_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sources: {
        Row: {
          channel: string
          created_at: string
          direction: string
          display_name: string
          last_error: string | null
          last_event_at: string | null
          metadata: Json
          provider: string
          setup_note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          direction?: string
          display_name: string
          last_error?: string | null
          last_event_at?: string | null
          metadata?: Json
          provider: string
          setup_note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          direction?: string
          display_name?: string
          last_error?: string | null
          last_event_at?: string | null
          metadata?: Json
          provider?: string
          setup_note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_touchpoints: {
        Row: {
          campaign_id: string | null
          channel: string
          content_key: string | null
          created_at: string
          cta_keyword: string | null
          event_type: string
          external_contact_id: string | null
          external_event_id: string | null
          fbclid: string | null
          gclid: string | null
          id: string
          integration_event_id: string | null
          landing_page: string | null
          lead_id: string
          message: string | null
          metadata: Json
          msclkid: string | null
          occurred_at: string
          provider: string | null
          referrer: string | null
          source_detail: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel: string
          content_key?: string | null
          created_at?: string
          cta_keyword?: string | null
          event_type: string
          external_contact_id?: string | null
          external_event_id?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          integration_event_id?: string | null
          landing_page?: string | null
          lead_id: string
          message?: string | null
          metadata?: Json
          msclkid?: string | null
          occurred_at?: string
          provider?: string | null
          referrer?: string | null
          source_detail?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel?: string
          content_key?: string | null
          created_at?: string
          cta_keyword?: string | null
          event_type?: string
          external_contact_id?: string | null
          external_event_id?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          integration_event_id?: string | null
          landing_page?: string | null
          lead_id?: string
          message?: string | null
          metadata?: Json
          msclkid?: string | null
          occurred_at?: string
          provider?: string | null
          referrer?: string | null
          source_detail?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_touchpoints_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "growth_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_touchpoints_integration_event_id_fkey"
            columns: ["integration_event_id"]
            isOneToOne: false
            referencedRelation: "integration_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_touchpoints_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          consent_at: string | null
          consent_marketing: boolean
          consent_source: string | null
          email: string | null
          email_normalized: string | null
          external_id: string | null
          external_url: string | null
          fbclid: string | null
          first_touch_at: string
          gclid: string | null
          id: string
          landing_page: string | null
          last_touch_at: string
          lead_score: number
          metadata: Json
          msclkid: string | null
          name: string
          next_step: string | null
          next_step_date: string | null
          notes: string | null
          phone: string | null
          phone_normalized: string | null
          source: string
          source_channel: string
          source_detail: string | null
          source_provider: string | null
          status: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          consent_at?: string | null
          consent_marketing?: boolean
          consent_source?: string | null
          email?: string | null
          email_normalized?: string | null
          external_id?: string | null
          external_url?: string | null
          fbclid?: string | null
          first_touch_at?: string
          gclid?: string | null
          id?: string
          landing_page?: string | null
          last_touch_at?: string
          lead_score?: number
          metadata?: Json
          msclkid?: string | null
          name: string
          next_step?: string | null
          next_step_date?: string | null
          notes?: string | null
          phone?: string | null
          phone_normalized?: string | null
          source?: string
          source_channel?: string
          source_detail?: string | null
          source_provider?: string | null
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          consent_at?: string | null
          consent_marketing?: boolean
          consent_source?: string | null
          email?: string | null
          email_normalized?: string | null
          external_id?: string | null
          external_url?: string | null
          fbclid?: string | null
          first_touch_at?: string
          gclid?: string | null
          id?: string
          landing_page?: string | null
          last_touch_at?: string
          lead_score?: number
          metadata?: Json
          msclkid?: string | null
          name?: string
          next_step?: string | null
          next_step_date?: string | null
          notes?: string | null
          phone?: string | null
          phone_normalized?: string | null
          source?: string
          source_channel?: string
          source_detail?: string | null
          source_provider?: string | null
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_news: {
        Row: {
          category: string
          created_at: string
          fetched_at: string
          id: string
          relevance_score: number | null
          source_name: string | null
          source_url: string | null
          summary: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          fetched_at?: string
          id?: string
          relevance_score?: number | null
          source_name?: string | null
          source_url?: string | null
          summary: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          fetched_at?: string
          id?: string
          relevance_score?: number | null
          source_name?: string | null
          source_url?: string | null
          summary?: string
          title?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          client_email: string
          client_name: string
          created_at: string
          id: string
          notify_on_file_upload: boolean
          notify_on_status_change: boolean
          notify_on_task_complete: boolean
        }
        Insert: {
          client_email: string
          client_name: string
          created_at?: string
          id?: string
          notify_on_file_upload?: boolean
          notify_on_status_change?: boolean
          notify_on_task_complete?: boolean
        }
        Update: {
          client_email?: string
          client_name?: string
          created_at?: string
          id?: string
          notify_on_file_upload?: boolean
          notify_on_status_change?: boolean
          notify_on_task_complete?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          assigned_team_member_id: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          assigned_team_member_id?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          assigned_team_member_id?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_assigned_team_member_id_fkey"
            columns: ["assigned_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string
          file_size: number
          file_type: string
          folder_id: string | null
          id: string
          name: string
          parent_file_id: string | null
          project_id: string
          status: string
          storage_path: string
          updated_at: string
          uploaded_by: string
          version: number
        }
        Insert: {
          created_at?: string
          file_size: number
          file_type: string
          folder_id?: string | null
          id?: string
          name: string
          parent_file_id?: string | null
          project_id: string
          status?: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
          version?: number
        }
        Update: {
          created_at?: string
          file_size?: number
          file_type?: string
          folder_id?: string | null
          id?: string
          name?: string
          parent_file_id?: string | null
          project_id?: string
          status?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "file_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_parent_file_id_fkey"
            columns: ["parent_file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          is_active: boolean
          joined_at: string
          project_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          joined_at?: string
          project_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          joined_at?: string
          project_id?: string
          user_id?: string
        }
        Relationships: []
      }
      project_template_items: {
        Row: {
          created_at: string
          description: string | null
          estimated_days: number | null
          id: string
          item_type: string
          name: string
          parent_id: string | null
          priority: string | null
          sort_order: number
          template_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_days?: number | null
          id?: string
          item_type: string
          name: string
          parent_id?: string | null
          priority?: string | null
          sort_order?: number
          template_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_days?: number | null
          id?: string
          item_type?: string
          name?: string
          parent_id?: string | null
          priority?: string | null
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_template_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_template_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          progress: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          progress?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          progress?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      request_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          request_id: string
          user_id: string
          user_name: string
          user_role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          request_id: string
          user_id: string
          user_name: string
          user_role?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          request_id?: string
          user_id?: string
          user_name?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "client_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          author_id: string | null
          client_name: string | null
          content: string
          created_at: string
          hashtags: string | null
          id: string
          platform: string
          scheduled_date: string
          scheduled_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          client_name?: string | null
          content: string
          created_at?: string
          hashtags?: string | null
          id?: string
          platform: string
          scheduled_date: string
          scheduled_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          client_name?: string | null
          content?: string
          created_at?: string
          hashtags?: string | null
          id?: string
          platform?: string
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      team_calendar_events: {
        Row: {
          all_day: boolean
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          end_time: string | null
          event_type: string
          id: string
          project_name: string | null
          start_date: string
          start_time: string | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type: string
          id?: string
          project_name?: string | null
          start_date: string
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          project_name?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      team_member_rates: {
        Row: {
          currency: string
          hourly_rate: number
          id: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          currency?: string
          hourly_rate?: number
          id?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          currency?: string
          hourly_rate?: number
          id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          role: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          is_running: boolean
          project_id: string | null
          start_time: string
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_running?: boolean
          project_id?: string | null
          start_time: string
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_running?: boolean
          project_id?: string | null
          start_time?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_member: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee" | "client"
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
    Enums: {
      app_role: ["admin", "manager", "employee", "client"],
    },
  },
} as const
