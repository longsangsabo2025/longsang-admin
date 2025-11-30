export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string;
          contact_id: string;
          created_at: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          metadata: Json | null;
          title: string;
          user_id: string | null;
        };
        Insert: {
          activity_type: string;
          contact_id: string;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          metadata?: Json | null;
          title: string;
          user_id?: string | null;
        };
        Update: {
          activity_type?: string;
          contact_id?: string;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          metadata?: Json | null;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'activities_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activities_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts_with_latest_activity';
            referencedColumns: ['id'];
          },
        ];
      };
      activity_logs: {
        Row: {
          action: string;
          agent_id: string | null;
          created_at: string | null;
          details: Json | null;
          duration_ms: number | null;
          error_message: string | null;
          id: string;
          status: string;
          workflow_id: string | null;
        };
        Insert: {
          action: string;
          agent_id?: string | null;
          created_at?: string | null;
          details?: Json | null;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          status: string;
          workflow_id?: string | null;
        };
        Update: {
          action?: string;
          agent_id?: string | null;
          created_at?: string | null;
          details?: Json | null;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          status?: string;
          workflow_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_logs_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'ai_agents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activity_logs_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'workflows';
            referencedColumns: ['id'];
          },
        ];
      };
      agent_budgets: {
        Row: {
          agent_id: string | null;
          alert_threshold_percent: number | null;
          auto_pause_on_exceed: boolean | null;
          created_at: string | null;
          current_daily_spent: number | null;
          current_monthly_spent: number | null;
          id: string;
          last_reset_daily: string | null;
          last_reset_monthly: string | null;
          max_daily_cost: number | null;
          max_monthly_cost: number | null;
          updated_at: string | null;
        };
        Insert: {
          agent_id?: string | null;
          alert_threshold_percent?: number | null;
          auto_pause_on_exceed?: boolean | null;
          created_at?: string | null;
          current_daily_spent?: number | null;
          current_monthly_spent?: number | null;
          id?: string;
          last_reset_daily?: string | null;
          last_reset_monthly?: string | null;
          max_daily_cost?: number | null;
          max_monthly_cost?: number | null;
          updated_at?: string | null;
        };
        Update: {
          agent_id?: string | null;
          alert_threshold_percent?: number | null;
          auto_pause_on_exceed?: boolean | null;
          created_at?: string | null;
          current_daily_spent?: number | null;
          current_monthly_spent?: number | null;
          id?: string;
          last_reset_daily?: string | null;
          last_reset_monthly?: string | null;
          max_daily_cost?: number | null;
          max_monthly_cost?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'agent_budgets_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'ai_agents';
            referencedColumns: ['id'];
          },
        ];
      };
      agent_executions: {
        Row: {
          agent_id: string | null;
          completed_at: string | null;
          cost_usd: number | null;
          created_by: string | null;
          error_message: string | null;
          execution_time_ms: number | null;
          id: string;
          input_data: Json | null;
          output_data: Json | null;
          started_at: string | null;
          status: string | null;
        };
        Insert: {
          agent_id?: string | null;
          completed_at?: string | null;
          cost_usd?: number | null;
          created_by?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          input_data?: Json | null;
          output_data?: Json | null;
          started_at?: string | null;
          status?: string | null;
        };
        Update: {
          agent_id?: string | null;
          completed_at?: string | null;
          cost_usd?: number | null;
          created_by?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          input_data?: Json | null;
          output_data?: Json | null;
          started_at?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'agent_executions_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
        ];
      };
      agents: {
        Row: {
          agent_type: string;
          avg_execution_time_ms: number | null;
          capabilities: Json | null;
          config: Json | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          failed_executions: number | null;
          id: string;
          last_used_at: string | null;
          metadata: Json | null;
          name: string;
          role: string;
          status: string | null;
          successful_executions: number | null;
          total_cost_usd: number | null;
          total_executions: number | null;
          updated_at: string | null;
        };
        Insert: {
          agent_type?: string;
          avg_execution_time_ms?: number | null;
          capabilities?: Json | null;
          config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          failed_executions?: number | null;
          id?: string;
          last_used_at?: string | null;
          metadata?: Json | null;
          name: string;
          role: string;
          status?: string | null;
          successful_executions?: number | null;
          total_cost_usd?: number | null;
          total_executions?: number | null;
          updated_at?: string | null;
        };
        Update: {
          agent_type?: string;
          avg_execution_time_ms?: number | null;
          capabilities?: Json | null;
          config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          failed_executions?: number | null;
          id?: string;
          last_used_at?: string | null;
          metadata?: Json | null;
          name?: string;
          role?: string;
          status?: string | null;
          successful_executions?: number | null;
          total_cost_usd?: number | null;
          total_executions?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ai_agents: {
        Row: {
          category: string | null;
          config: Json | null;
          created_at: string | null;
          description: string | null;
          id: string;
          last_error: string | null;
          last_run: string | null;
          name: string;
          status: string | null;
          successful_runs: number | null;
          total_runs: number | null;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          config?: Json | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          last_error?: string | null;
          last_run?: string | null;
          name: string;
          status?: string | null;
          successful_runs?: number | null;
          total_runs?: number | null;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          config?: Json | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          last_error?: string | null;
          last_run?: string | null;
          name?: string;
          status?: string | null;
          successful_runs?: number | null;
          total_runs?: number | null;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ai_usage_logs: {
        Row: {
          content_type: string;
          cost_usd: number | null;
          created_at: string;
          error_message: string | null;
          id: string;
          input_cost_usd: number | null;
          input_tokens: number;
          ip_address: unknown;
          max_tokens: number | null;
          model: string;
          model_used: string | null;
          output_cost_usd: number | null;
          output_tokens: number;
          prompt_text: string | null;
          request_params: Json;
          response_id: string | null;
          response_time_ms: number | null;
          temperature: number | null;
          total_cost_usd: number | null;
          total_tokens: number | null;
          user_agent: string | null;
          user_id: string;
          was_successful: boolean;
        };
        Insert: {
          content_type: string;
          cost_usd?: number | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          input_cost_usd?: number | null;
          input_tokens: number;
          ip_address?: unknown;
          max_tokens?: number | null;
          model?: string;
          model_used?: string | null;
          output_cost_usd?: number | null;
          output_tokens: number;
          prompt_text?: string | null;
          request_params: Json;
          response_id?: string | null;
          response_time_ms?: number | null;
          temperature?: number | null;
          total_cost_usd?: number | null;
          total_tokens?: number | null;
          user_agent?: string | null;
          user_id: string;
          was_successful?: boolean;
        };
        Update: {
          content_type?: string;
          cost_usd?: number | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          input_cost_usd?: number | null;
          input_tokens?: number;
          ip_address?: unknown;
          max_tokens?: number | null;
          model?: string;
          model_used?: string | null;
          output_cost_usd?: number | null;
          output_tokens?: number;
          prompt_text?: string | null;
          request_params?: Json;
          response_id?: string | null;
          response_time_ms?: number | null;
          temperature?: number | null;
          total_cost_usd?: number | null;
          total_tokens?: number | null;
          user_agent?: string | null;
          user_id?: string;
          was_successful?: boolean;
        };
        Relationships: [];
      };
      ai_usage_stats: {
        Row: {
          avg_response_time_ms: number | null;
          blogs_count: number;
          created_at: string;
          custom_count: number;
          error_count: number;
          id: string;
          projects_count: number;
          services_count: number;
          stat_date: string;
          total_cost_usd: number;
          total_generations: number;
          total_input_tokens: number;
          total_output_tokens: number;
          total_users: number;
          updated_at: string;
        };
        Insert: {
          avg_response_time_ms?: number | null;
          blogs_count?: number;
          created_at?: string;
          custom_count?: number;
          error_count?: number;
          id?: string;
          projects_count?: number;
          services_count?: number;
          stat_date: string;
          total_cost_usd?: number;
          total_generations?: number;
          total_input_tokens?: number;
          total_output_tokens?: number;
          total_users?: number;
          updated_at?: string;
        };
        Update: {
          avg_response_time_ms?: number | null;
          blogs_count?: number;
          created_at?: string;
          custom_count?: number;
          error_count?: number;
          id?: string;
          projects_count?: number;
          services_count?: number;
          stat_date?: string;
          total_cost_usd?: number;
          total_generations?: number;
          total_input_tokens?: number;
          total_output_tokens?: number;
          total_users?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          contact_id: string | null;
          created_at: string | null;
          event_name: string;
          event_type: string;
          id: string;
          ip_address: unknown;
          properties: Json | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          contact_id?: string | null;
          created_at?: string | null;
          event_name: string;
          event_type: string;
          id?: string;
          ip_address?: unknown;
          properties?: Json | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          contact_id?: string | null;
          created_at?: string | null;
          event_name?: string;
          event_type?: string;
          id?: string;
          ip_address?: unknown;
          properties?: Json | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_events_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'analytics_events_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts_with_latest_activity';
            referencedColumns: ['id'];
          },
        ];
      };
      api_keys_vault: {
        Row: {
          agent_id: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          key_hash: string;
          key_name: string | null;
          last_rotated: string | null;
          provider: string;
          rotation_interval_days: number | null;
          updated_at: string | null;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash: string;
          key_name?: string | null;
          last_rotated?: string | null;
          provider: string;
          rotation_interval_days?: number | null;
          updated_at?: string | null;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash?: string;
          key_name?: string | null;
          last_rotated?: string | null;
          provider?: string;
          rotation_interval_days?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'api_keys_vault_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'ai_agents';
            referencedColumns: ['id'];
          },
        ];
      };
      attachments: {
        Row: {
          contact_id: string;
          created_at: string | null;
          file_name: string;
          file_size: number | null;
          file_type: string | null;
          file_url: string;
          id: string;
          is_public: boolean | null;
          metadata: Json | null;
          storage_path: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          contact_id: string;
          created_at?: string | null;
          file_name: string;
          file_size?: number | null;
          file_type?: string | null;
          file_url: string;
          id?: string;
          is_public?: boolean | null;
          metadata?: Json | null;
          storage_path?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          contact_id?: string;
          created_at?: string | null;
          file_name?: string;
          file_size?: number | null;
          file_type?: string | null;
          file_url?: string;
          id?: string;
          is_public?: boolean | null;
          metadata?: Json | null;
          storage_path?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'attachments_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attachments_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts_with_latest_activity';
            referencedColumns: ['id'];
          },
        ];
      };
      automation_rules: {
        Row: {
          actions: Json;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          execution_count: number | null;
          id: string;
          is_active: boolean | null;
          last_executed_at: string | null;
          name: string;
          trigger_conditions: Json;
          trigger_type: string;
          updated_at: string | null;
        };
        Insert: {
          actions: Json;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          execution_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          last_executed_at?: string | null;
          name: string;
          trigger_conditions: Json;
          trigger_type: string;
          updated_at?: string | null;
        };
        Update: {
          actions?: Json;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          execution_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          last_executed_at?: string | null;
          name?: string;
          trigger_conditions?: Json;
          trigger_type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      automation_triggers: {
        Row: {
          agent_id: string | null;
          created_at: string | null;
          enabled: boolean | null;
          id: string;
          last_triggered: string | null;
          trigger_config: Json | null;
          trigger_type: string;
          updated_at: string | null;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string | null;
          enabled?: boolean | null;
          id?: string;
          last_triggered?: string | null;
          trigger_config?: Json | null;
          trigger_type: string;
          updated_at?: string | null;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string | null;
          enabled?: boolean | null;
          id?: string;
          last_triggered?: string | null;
          trigger_config?: Json | null;
          trigger_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'automation_triggers_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'ai_agents';
            referencedColumns: ['id'];
          },
        ];
      };
      availability_settings: {
        Row: {
          created_at: string | null;
          day_of_week: number;
          end_time: string;
          id: string;
          is_available: boolean | null;
          start_time: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          day_of_week: number;
          end_time: string;
          id?: string;
          is_available?: boolean | null;
          start_time: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          is_available?: boolean | null;
          start_time?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      budget_alerts: {
        Row: {
          acknowledged: boolean | null;
          acknowledged_at: string | null;
          agent_id: string | null;
          alert_type: string;
          created_at: string | null;
          current_amount: number | null;
          id: string;
          message: string;
          threshold_amount: number | null;
        };
        Insert: {
          acknowledged?: boolean | null;
          acknowledged_at?: string | null;
          agent_id?: string | null;
          alert_type: string;
          created_at?: string | null;
          current_amount?: number | null;
          id?: string;
          message: string;
          threshold_amount?: number | null;
        };
        Update: {
          acknowledged?: boolean | null;
          acknowledged_at?: string | null;
          agent_id?: string | null;
          alert_type?: string;
          created_at?: string | null;
          current_amount?: number | null;
          id?: string;
          message?: string;
          threshold_amount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_alerts_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'ai_agents';
            referencedColumns: ['id'];
          },
        ];
      };
      consultation_bookings: {
        Row: {
          company: string | null;
          created_at: string | null;
          email: string;
          id: string;
          message: string | null;
          name: string;
          phone: string | null;
          preferred_date: string | null;
          preferred_time: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          company?: string | null;
          created_at?: string | null;
          email: string;
          id?: string;
          message?: string | null;
          name: string;
          phone?: string | null;
          preferred_date?: string | null;
          preferred_time?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          company?: string | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          message?: string | null;
          name?: string;
          phone?: string | null;
          preferred_date?: string | null;
          preferred_time?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      consultation_types: {
        Row: {
          color: string | null;
          created_at: string | null;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          is_active: boolean | null;
          name: string;
          price: number | null;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          price?: number | null;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          price?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      consultations: {
        Row: {
          cancellation_reason: string | null;
          cancelled_at: string | null;
          client_email: string;
          client_name: string;
          client_phone: string | null;
          consultant_id: string | null;
          consultation_date: string;
          consultation_type: string | null;
          created_at: string | null;
          duration_minutes: number | null;
          end_time: string;
          id: string;
          meeting_link: string | null;
          notes: string | null;
          reminder_sent: boolean | null;
          start_time: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          client_email: string;
          client_name: string;
          client_phone?: string | null;
          consultant_id?: string | null;
          consultation_date: string;
          consultation_type?: string | null;
          created_at?: string | null;
          duration_minutes?: number | null;
          end_time: string;
          id?: string;
          meeting_link?: string | null;
          notes?: string | null;
          reminder_sent?: boolean | null;
          start_time: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          client_email?: string;
          client_name?: string;
          client_phone?: string | null;
          consultant_id?: string | null;
          consultation_date?: string;
          consultation_type?: string | null;
          created_at?: string | null;
          duration_minutes?: number | null;
          end_time?: string;
          id?: string;
          meeting_link?: string | null;
          notes?: string | null;
          reminder_sent?: boolean | null;
          start_time?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          assigned_to: string | null;
          budget: string | null;
          company: string | null;
          country: string | null;
          created_at: string | null;
          currency: string | null;
          deal_value: number | null;
          email: string;
          id: string;
          is_archived: boolean | null;
          last_contacted_at: string | null;
          lead_score: number | null;
          lost_at: string | null;
          lost_reason: string | null;
          message: string;
          name: string;
          next_follow_up: string | null;
          phone: string | null;
          pipeline_stage: string | null;
          priority: string | null;
          service: string;
          source: string | null;
          status: string | null;
          subscribe_newsletter: boolean | null;
          tags: string[] | null;
          updated_at: string | null;
          won_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          budget?: string | null;
          company?: string | null;
          country?: string | null;
          created_at?: string | null;
          currency?: string | null;
          deal_value?: number | null;
          email: string;
          id?: string;
          is_archived?: boolean | null;
          last_contacted_at?: string | null;
          lead_score?: number | null;
          lost_at?: string | null;
          lost_reason?: string | null;
          message: string;
          name: string;
          next_follow_up?: string | null;
          phone?: string | null;
          pipeline_stage?: string | null;
          priority?: string | null;
          service: string;
          source?: string | null;
          status?: string | null;
          subscribe_newsletter?: boolean | null;
          tags?: string[] | null;
          updated_at?: string | null;
          won_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          budget?: string | null;
          company?: string | null;
          country?: string | null;
          created_at?: string | null;
          currency?: string | null;
          deal_value?: number | null;
          email?: string;
          id?: string;
          is_archived?: boolean | null;
          last_contacted_at?: string | null;
          lead_score?: number | null;
          lost_at?: string | null;
          lost_reason?: string | null;
          message?: string;
          name?: string;
          next_follow_up?: string | null;
          phone?: string | null;
          pipeline_stage?: string | null;
          priority?: string | null;
          service?: string;
          source?: string | null;
          status?: string | null;
          subscribe_newsletter?: boolean | null;
          tags?: string[] | null;
          updated_at?: string | null;
          won_at?: string | null;
        };
        Relationships: [];
      };
      content_queue: {
        Row: {
          agent_id: string | null;
          content: Json;
          content_type: string;
          created_at: string | null;
          error_message: string | null;
          id: string;
          metadata: Json | null;
          priority: number | null;
          published_at: string | null;
          retry_count: number | null;
          scheduled_for: string | null;
          status: string | null;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          agent_id?: string | null;
          content?: Json;
          content_type: string;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          priority?: number | null;
          published_at?: string | null;
          retry_count?: number | null;
          scheduled_for?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          agent_id?: string | null;
          content?: Json;
          content_type?: string;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          priority?: number | null;
          published_at?: string | null;
          retry_count?: number | null;
          scheduled_for?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'content_queue_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'ai_agents';
            referencedColumns: ['id'];
          },
        ];
      };
      cost_analytics: {
        Row: {
          agent_id: string | null;
          avg_cost_per_request: number | null;
          avg_tokens_per_request: number | null;
          created_at: string | null;
          date: string;
          id: string;
          models_used: Json | null;
          total_cost: number | null;
          total_requests: number | null;
          total_tokens: number | null;
        };
        Insert: {
          agent_id?: string | null;
          avg_cost_per_request?: number | null;
          avg_tokens_per_request?: number | null;
          created_at?: string | null;
          date: string;
          id?: string;
          models_used?: Json | null;
          total_cost?: number | null;
          total_requests?: number | null;
          total_tokens?: number | null;
        };
        Update: {
          agent_id?: string | null;
          avg_cost_per_request?: number | null;
          avg_tokens_per_request?: number | null;
          created_at?: string | null;
          date?: string;
          id?: string;
          models_used?: Json | null;
          total_cost?: number | null;
          total_requests?: number | null;
          total_tokens?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cost_analytics_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'ai_agents';
            referencedColumns: ['id'];
          },
        ];
      };
      credentials: {
        Row: {
          access_count: number | null;
          category: string;
          created_at: string | null;
          encrypted_api_key: string | null;
          encrypted_password: string | null;
          id: string;
          is_favorite: boolean | null;
          last_accessed_at: string | null;
          name: string;
          notes: string | null;
          tags: string[] | null;
          updated_at: string | null;
          url: string | null;
          user_id: string | null;
          username: string | null;
        };
        Insert: {
          access_count?: number | null;
          category: string;
          created_at?: string | null;
          encrypted_api_key?: string | null;
          encrypted_password?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          last_accessed_at?: string | null;
          name: string;
          notes?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          url?: string | null;
          user_id?: string | null;
          username?: string | null;
        };
        Update: {
          access_count?: number | null;
          category?: string;
          created_at?: string | null;
          encrypted_api_key?: string | null;
          encrypted_password?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          last_accessed_at?: string | null;
          name?: string;
          notes?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          url?: string | null;
          user_id?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          body: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          subject: string;
          template_type: string | null;
          updated_at: string | null;
          usage_count: number | null;
          variables: string[] | null;
        };
        Insert: {
          body: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          subject: string;
          template_type?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          variables?: string[] | null;
        };
        Update: {
          body?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          subject?: string;
          template_type?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          variables?: string[] | null;
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          created_at: string | null;
          description: string | null;
          enterprise_plan: boolean | null;
          feature_key: string;
          feature_name: string;
          free_plan: boolean | null;
          id: string;
          is_active: boolean | null;
          pro_plan: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          enterprise_plan?: boolean | null;
          feature_key: string;
          feature_name: string;
          free_plan?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          pro_plan?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          enterprise_plan?: boolean | null;
          feature_key?: string;
          feature_name?: string;
          free_plan?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          pro_plan?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      google_reports: {
        Row: {
          created_at: string | null;
          date_range_end: string;
          date_range_start: string;
          id: string;
          metrics: Json | null;
          report_title: string;
          report_type: string;
          sheet_name: string | null;
          spreadsheet_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          date_range_end: string;
          date_range_start: string;
          id?: string;
          metrics?: Json | null;
          report_title: string;
          report_type: string;
          sheet_name?: string | null;
          spreadsheet_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          date_range_end?: string;
          date_range_start?: string;
          id?: string;
          metrics?: Json | null;
          report_title?: string;
          report_type?: string;
          sheet_name?: string | null;
          spreadsheet_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      google_services_config: {
        Row: {
          analytics_enabled: boolean | null;
          analytics_property_id: string | null;
          created_at: string | null;
          daily_sync_enabled: boolean | null;
          email_reports: boolean | null;
          id: string;
          report_recipients: string[] | null;
          reporting_spreadsheet_id: string | null;
          search_console_enabled: boolean | null;
          sheets_auto_sync: boolean | null;
          sync_time: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          analytics_enabled?: boolean | null;
          analytics_property_id?: string | null;
          created_at?: string | null;
          daily_sync_enabled?: boolean | null;
          email_reports?: boolean | null;
          id?: string;
          report_recipients?: string[] | null;
          reporting_spreadsheet_id?: string | null;
          search_console_enabled?: boolean | null;
          sheets_auto_sync?: boolean | null;
          sync_time?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          analytics_enabled?: boolean | null;
          analytics_property_id?: string | null;
          created_at?: string | null;
          daily_sync_enabled?: boolean | null;
          email_reports?: boolean | null;
          id?: string;
          report_recipients?: string[] | null;
          reporting_spreadsheet_id?: string | null;
          search_console_enabled?: boolean | null;
          sheets_auto_sync?: boolean | null;
          sync_time?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      google_sync_logs: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          error_message: string | null;
          id: string;
          records_synced: number | null;
          service: string;
          started_at: string;
          status: string;
          user_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          records_synced?: number | null;
          service: string;
          started_at: string;
          status: string;
          user_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          records_synced?: number | null;
          service?: string;
          started_at?: string;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          attachments: Json | null;
          contact_id: string;
          content: string;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          message_type: string | null;
          parent_message_id: string | null;
          read_at: string | null;
          sender_email: string | null;
          sender_id: string | null;
          sender_name: string | null;
          sender_type: string;
        };
        Insert: {
          attachments?: Json | null;
          contact_id: string;
          content: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message_type?: string | null;
          parent_message_id?: string | null;
          read_at?: string | null;
          sender_email?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_type: string;
        };
        Update: {
          attachments?: Json | null;
          contact_id?: string;
          content?: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message_type?: string | null;
          parent_message_id?: string | null;
          read_at?: string | null;
          sender_email?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts_with_latest_activity';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_parent_message_id_fkey';
            columns: ['parent_message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
        ];
      };
      n8n_executions: {
        Row: {
          created_at: string | null;
          duration_ms: number | null;
          end_time: string | null;
          error_message: string | null;
          id: string;
          input_data: Json | null;
          n8n_execution_id: string;
          output_data: Json | null;
          start_time: string;
          status: string;
          workflow_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          duration_ms?: number | null;
          end_time?: string | null;
          error_message?: string | null;
          id?: string;
          input_data?: Json | null;
          n8n_execution_id: string;
          output_data?: Json | null;
          start_time?: string;
          status: string;
          workflow_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          duration_ms?: number | null;
          end_time?: string | null;
          error_message?: string | null;
          id?: string;
          input_data?: Json | null;
          n8n_execution_id?: string;
          output_data?: Json | null;
          start_time?: string;
          status?: string;
          workflow_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'n8n_executions_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'n8n_workflows';
            referencedColumns: ['id'];
          },
        ];
      };
      n8n_workflow_templates: {
        Row: {
          category: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_public: boolean | null;
          name: string;
          tags: string[] | null;
          template_data: Json;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          name: string;
          tags?: string[] | null;
          template_data: Json;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          name?: string;
          tags?: string[] | null;
          template_data?: Json;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [];
      };
      n8n_workflows: {
        Row: {
          agent_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          last_execution: string | null;
          n8n_data: Json | null;
          name: string;
          status: string | null;
          successful_executions: number | null;
          tags: string[] | null;
          total_executions: number | null;
          updated_at: string | null;
          webhook_url: string | null;
          workflow_id: string;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          last_execution?: string | null;
          n8n_data?: Json | null;
          name: string;
          status?: string | null;
          successful_executions?: number | null;
          tags?: string[] | null;
          total_executions?: number | null;
          updated_at?: string | null;
          webhook_url?: string | null;
          workflow_id: string;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          last_execution?: string | null;
          n8n_data?: Json | null;
          name?: string;
          status?: string | null;
          successful_executions?: number | null;
          tags?: string[] | null;
          total_executions?: number | null;
          updated_at?: string | null;
          webhook_url?: string | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'n8n_workflows_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'ai_agents';
            referencedColumns: ['id'];
          },
        ];
      };
      notes: {
        Row: {
          contact_id: string;
          content: string;
          created_at: string | null;
          id: string;
          is_pinned: boolean | null;
          is_private: boolean | null;
          mentioned_users: string[] | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          contact_id: string;
          content: string;
          created_at?: string | null;
          id?: string;
          is_pinned?: boolean | null;
          is_private?: boolean | null;
          mentioned_users?: string[] | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          contact_id?: string;
          content?: string;
          created_at?: string | null;
          id?: string;
          is_pinned?: boolean | null;
          is_private?: boolean | null;
          mentioned_users?: string[] | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts_with_latest_activity';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          action_url: string | null;
          body: string;
          created_at: string | null;
          data: Json | null;
          icon: string | null;
          id: string;
          is_read: boolean | null;
          read_at: string | null;
          sent_via: string[] | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          body: string;
          created_at?: string | null;
          data?: Json | null;
          icon?: string | null;
          id?: string;
          is_read?: boolean | null;
          read_at?: string | null;
          sent_via?: string[] | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          body?: string;
          created_at?: string | null;
          data?: Json | null;
          icon?: string | null;
          id?: string;
          is_read?: boolean | null;
          read_at?: string | null;
          sent_via?: string[] | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payment_history: {
        Row: {
          amount: number;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          id: string;
          paid_at: string | null;
          status: string;
          stripe_invoice_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_receipt_url: string | null;
          subscription_id: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          paid_at?: string | null;
          status: string;
          stripe_invoice_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_receipt_url?: string | null;
          subscription_id?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          paid_at?: string | null;
          status?: string;
          stripe_invoice_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_receipt_url?: string | null;
          subscription_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_history_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'user_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      pipeline_stages: {
        Row: {
          automation_rules: string[] | null;
          color: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          name: string;
          position: number;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          automation_rules?: string[] | null;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name: string;
          position: number;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          automation_rules?: string[] | null;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name?: string;
          position?: number;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          full_name: string | null;
          id: string;
          is_active: boolean | null;
          last_seen_at: string | null;
          notification_settings: Json | null;
          phone: string | null;
          preferences: Json | null;
          role: string | null;
          timezone: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id: string;
          is_active?: boolean | null;
          last_seen_at?: string | null;
          notification_settings?: Json | null;
          phone?: string | null;
          preferences?: Json | null;
          role?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_seen_at?: string | null;
          notification_settings?: Json | null;
          phone?: string | null;
          preferences?: Json | null;
          role?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          budget_usd: number | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          name: string;
          spent_usd: number | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          budget_usd?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          name: string;
          spent_usd?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          budget_usd?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          name?: string;
          spent_usd?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      seo_analytics: {
        Row: {
          avg_position: number | null;
          created_at: string | null;
          date: string | null;
          domain_id: string | null;
          id: string;
          organic_traffic: number | null;
          top_rankings: number | null;
          total_indexed: number | null;
        };
        Insert: {
          avg_position?: number | null;
          created_at?: string | null;
          date?: string | null;
          domain_id?: string | null;
          id?: string;
          organic_traffic?: number | null;
          top_rankings?: number | null;
          total_indexed?: number | null;
        };
        Update: {
          avg_position?: number | null;
          created_at?: string | null;
          date?: string | null;
          domain_id?: string | null;
          id?: string;
          organic_traffic?: number | null;
          top_rankings?: number | null;
          total_indexed?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_analytics_domain_id_fkey';
            columns: ['domain_id'];
            isOneToOne: false;
            referencedRelation: 'seo_domains';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_domains: {
        Row: {
          auto_index: boolean | null;
          bing_api_key: string | null;
          created_at: string | null;
          created_by: string | null;
          enabled: boolean | null;
          google_service_account_json: Json | null;
          id: string;
          indexed_urls: number | null;
          name: string;
          total_urls: number | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          auto_index?: boolean | null;
          bing_api_key?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          enabled?: boolean | null;
          google_service_account_json?: Json | null;
          id?: string;
          indexed_urls?: number | null;
          name: string;
          total_urls?: number | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          auto_index?: boolean | null;
          bing_api_key?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          enabled?: boolean | null;
          google_service_account_json?: Json | null;
          id?: string;
          indexed_urls?: number | null;
          name?: string;
          total_urls?: number | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [];
      };
      seo_indexing_queue: {
        Row: {
          created_at: string | null;
          domain_id: string | null;
          error_message: string | null;
          id: string;
          indexed_at: string | null;
          retry_count: number | null;
          search_engine: string | null;
          status: string | null;
          submitted_at: string | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          domain_id?: string | null;
          error_message?: string | null;
          id?: string;
          indexed_at?: string | null;
          retry_count?: number | null;
          search_engine?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          created_at?: string | null;
          domain_id?: string | null;
          error_message?: string | null;
          id?: string;
          indexed_at?: string | null;
          retry_count?: number | null;
          search_engine?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_indexing_queue_domain_id_fkey';
            columns: ['domain_id'];
            isOneToOne: false;
            referencedRelation: 'seo_domains';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_keywords: {
        Row: {
          created_at: string | null;
          current_position: number | null;
          difficulty: string | null;
          domain_id: string | null;
          id: string;
          keyword: string;
          previous_position: number | null;
          target_url: string | null;
          updated_at: string | null;
          volume: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_position?: number | null;
          difficulty?: string | null;
          domain_id?: string | null;
          id?: string;
          keyword: string;
          previous_position?: number | null;
          target_url?: string | null;
          updated_at?: string | null;
          volume?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_position?: number | null;
          difficulty?: string | null;
          domain_id?: string | null;
          id?: string;
          keyword?: string;
          previous_position?: number | null;
          target_url?: string | null;
          updated_at?: string | null;
          volume?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_keywords_domain_id_fkey';
            columns: ['domain_id'];
            isOneToOne: false;
            referencedRelation: 'seo_domains';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_pages: {
        Row: {
          avg_time_on_page: number | null;
          bounce_rate: number | null;
          created_at: string | null;
          description: string | null;
          id: string;
          keywords: string[] | null;
          page_url: string;
          page_views: number | null;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          avg_time_on_page?: number | null;
          bounce_rate?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          keywords?: string[] | null;
          page_url: string;
          page_views?: number | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avg_time_on_page?: number | null;
          bounce_rate?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          keywords?: string[] | null;
          page_url?: string;
          page_views?: number | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      seo_settings: {
        Row: {
          auto_submit_new_content: boolean | null;
          bing_api_enabled: boolean | null;
          created_at: string | null;
          google_api_enabled: boolean | null;
          google_daily_quota_limit: number | null;
          id: string;
          retry_failed_after_hours: number | null;
          search_console_webhook: string | null;
          sitemap_auto_update: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          auto_submit_new_content?: boolean | null;
          bing_api_enabled?: boolean | null;
          created_at?: string | null;
          google_api_enabled?: boolean | null;
          google_daily_quota_limit?: number | null;
          id?: string;
          retry_failed_after_hours?: number | null;
          search_console_webhook?: string | null;
          sitemap_auto_update?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          auto_submit_new_content?: boolean | null;
          bing_api_enabled?: boolean | null;
          created_at?: string | null;
          google_api_enabled?: boolean | null;
          google_daily_quota_limit?: number | null;
          id?: string;
          retry_failed_after_hours?: number | null;
          search_console_webhook?: string | null;
          sitemap_auto_update?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      seo_sitemaps: {
        Row: {
          created_at: string | null;
          domain_id: string | null;
          file_size: string | null;
          id: string;
          last_generated: string | null;
          total_urls: number | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          domain_id?: string | null;
          file_size?: string | null;
          id?: string;
          last_generated?: string | null;
          total_urls?: number | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          created_at?: string | null;
          domain_id?: string | null;
          file_size?: string | null;
          id?: string;
          last_generated?: string | null;
          total_urls?: number | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_sitemaps_domain_id_fkey';
            columns: ['domain_id'];
            isOneToOne: false;
            referencedRelation: 'seo_domains';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_plans: {
        Row: {
          created_at: string | null;
          currency: string | null;
          description: string | null;
          display_name: string;
          features: Json;
          has_advanced_analytics: boolean | null;
          has_custom_branding: boolean | null;
          has_google_drive: boolean | null;
          has_priority_support: boolean | null;
          has_webhooks: boolean | null;
          id: string;
          is_active: boolean | null;
          max_agents: number | null;
          max_api_calls: number | null;
          max_credentials: number | null;
          max_seo_websites: number | null;
          max_storage_mb: number | null;
          max_team_members: number | null;
          max_workflows: number | null;
          name: string;
          price_monthly: number;
          price_yearly: number;
          sort_order: number | null;
          stripe_price_id_monthly: string | null;
          stripe_price_id_yearly: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          display_name: string;
          features?: Json;
          has_advanced_analytics?: boolean | null;
          has_custom_branding?: boolean | null;
          has_google_drive?: boolean | null;
          has_priority_support?: boolean | null;
          has_webhooks?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          max_agents?: number | null;
          max_api_calls?: number | null;
          max_credentials?: number | null;
          max_seo_websites?: number | null;
          max_storage_mb?: number | null;
          max_team_members?: number | null;
          max_workflows?: number | null;
          name: string;
          price_monthly?: number;
          price_yearly?: number;
          sort_order?: number | null;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          display_name?: string;
          features?: Json;
          has_advanced_analytics?: boolean | null;
          has_custom_branding?: boolean | null;
          has_google_drive?: boolean | null;
          has_priority_support?: boolean | null;
          has_webhooks?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          max_agents?: number | null;
          max_api_calls?: number | null;
          max_credentials?: number | null;
          max_seo_websites?: number | null;
          max_storage_mb?: number | null;
          max_team_members?: number | null;
          max_workflows?: number | null;
          name?: string;
          price_monthly?: number;
          price_yearly?: number;
          sort_order?: number | null;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          assigned_to: string | null;
          completed_at: string | null;
          completed_by: string | null;
          contact_id: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          priority: string | null;
          reminder_at: string | null;
          status: string | null;
          task_type: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority?: string | null;
          reminder_at?: string | null;
          status?: string | null;
          task_type?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority?: string | null;
          reminder_at?: string | null;
          status?: string | null;
          task_type?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts_with_latest_activity';
            referencedColumns: ['id'];
          },
        ];
      };
      tools: {
        Row: {
          config: Json | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          status: string | null;
          tool_type: string;
          updated_at: string | null;
        };
        Insert: {
          config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          status?: string | null;
          tool_type?: string;
          updated_at?: string | null;
        };
        Update: {
          config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          status?: string | null;
          tool_type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      unavailable_dates: {
        Row: {
          created_at: string | null;
          date: string;
          id: string;
          reason: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          date: string;
          id?: string;
          reason?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          date?: string;
          id?: string;
          reason?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      usage_tracking: {
        Row: {
          agents_created: number | null;
          api_calls_count: number | null;
          created_at: string | null;
          credentials_stored: number | null;
          id: string;
          period_end: string | null;
          period_start: string | null;
          storage_used_mb: number | null;
          updated_at: string | null;
          user_id: string;
          workflows_executed: number | null;
        };
        Insert: {
          agents_created?: number | null;
          api_calls_count?: number | null;
          created_at?: string | null;
          credentials_stored?: number | null;
          id?: string;
          period_end?: string | null;
          period_start?: string | null;
          storage_used_mb?: number | null;
          updated_at?: string | null;
          user_id: string;
          workflows_executed?: number | null;
        };
        Update: {
          agents_created?: number | null;
          api_calls_count?: number | null;
          created_at?: string | null;
          credentials_stored?: number | null;
          id?: string;
          period_end?: string | null;
          period_start?: string | null;
          storage_used_mb?: number | null;
          updated_at?: string | null;
          user_id?: string;
          workflows_executed?: number | null;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          billing_cycle: string | null;
          cancelled_at: string | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          last_payment_date: string | null;
          next_payment_date: string | null;
          plan_id: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_ends_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          billing_cycle?: string | null;
          cancelled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          last_payment_date?: string | null;
          next_payment_date?: string | null;
          plan_id: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          billing_cycle?: string | null;
          cancelled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          last_payment_date?: string | null;
          next_payment_date?: string | null;
          plan_id?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_subscriptions_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'subscription_plans';
            referencedColumns: ['id'];
          },
        ];
      };
      website_blog_posts: {
        Row: {
          author_id: string | null;
          category: string;
          content_en: string;
          content_vi: string;
          cover_image_url: string | null;
          created_at: string | null;
          excerpt_en: string | null;
          excerpt_vi: string | null;
          id: string;
          is_published: boolean | null;
          published_at: string | null;
          read_time_minutes: number | null;
          slug: string;
          tags: string[] | null;
          title_en: string;
          title_vi: string;
          updated_at: string | null;
          views_count: number | null;
        };
        Insert: {
          author_id?: string | null;
          category: string;
          content_en: string;
          content_vi: string;
          cover_image_url?: string | null;
          created_at?: string | null;
          excerpt_en?: string | null;
          excerpt_vi?: string | null;
          id?: string;
          is_published?: boolean | null;
          published_at?: string | null;
          read_time_minutes?: number | null;
          slug: string;
          tags?: string[] | null;
          title_en: string;
          title_vi: string;
          updated_at?: string | null;
          views_count?: number | null;
        };
        Update: {
          author_id?: string | null;
          category?: string;
          content_en?: string;
          content_vi?: string;
          cover_image_url?: string | null;
          created_at?: string | null;
          excerpt_en?: string | null;
          excerpt_vi?: string | null;
          id?: string;
          is_published?: boolean | null;
          published_at?: string | null;
          read_time_minutes?: number | null;
          slug?: string;
          tags?: string[] | null;
          title_en?: string;
          title_vi?: string;
          updated_at?: string | null;
          views_count?: number | null;
        };
        Relationships: [];
      };
      website_projects: {
        Row: {
          category: string | null;
          client_name: string | null;
          created_at: string | null;
          created_by: string | null;
          demo_url: string | null;
          description_en: string;
          description_vi: string;
          full_description_en: string | null;
          full_description_vi: string | null;
          github_url: string | null;
          id: string;
          image_url: string | null;
          is_featured: boolean | null;
          is_published: boolean | null;
          project_date: string | null;
          sort_order: number | null;
          tech_stack: string[] | null;
          title_en: string;
          title_vi: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          client_name?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          demo_url?: string | null;
          description_en: string;
          description_vi: string;
          full_description_en?: string | null;
          full_description_vi?: string | null;
          github_url?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean | null;
          is_published?: boolean | null;
          project_date?: string | null;
          sort_order?: number | null;
          tech_stack?: string[] | null;
          title_en: string;
          title_vi: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          client_name?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          demo_url?: string | null;
          description_en?: string;
          description_vi?: string;
          full_description_en?: string | null;
          full_description_vi?: string | null;
          github_url?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean | null;
          is_published?: boolean | null;
          project_date?: string | null;
          sort_order?: number | null;
          tech_stack?: string[] | null;
          title_en?: string;
          title_vi?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      website_services: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description_en: string;
          description_vi: string;
          icon: string;
          id: string;
          is_published: boolean | null;
          sort_order: number | null;
          tech_stack: string[] | null;
          title_en: string;
          title_vi: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description_en: string;
          description_vi: string;
          icon: string;
          id?: string;
          is_published?: boolean | null;
          sort_order?: number | null;
          tech_stack?: string[] | null;
          title_en: string;
          title_vi: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description_en?: string;
          description_vi?: string;
          icon?: string;
          id?: string;
          is_published?: boolean | null;
          sort_order?: number | null;
          tech_stack?: string[] | null;
          title_en?: string;
          title_vi?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      website_settings: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          key: string;
          updated_at: string | null;
          value: Json;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          key: string;
          updated_at?: string | null;
          value: Json;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          key?: string;
          updated_at?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      website_stats: {
        Row: {
          created_at: string | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          label_en: string;
          label_vi: string;
          sort_order: number | null;
          stat_key: string;
          updated_at: string | null;
          value: string;
        };
        Insert: {
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          label_en: string;
          label_vi: string;
          sort_order?: number | null;
          stat_key: string;
          updated_at?: string | null;
          value: string;
        };
        Update: {
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          label_en?: string;
          label_vi?: string;
          sort_order?: number | null;
          stat_key?: string;
          updated_at?: string | null;
          value?: string;
        };
        Relationships: [];
      };
      website_tech_stack: {
        Row: {
          category: string;
          created_at: string | null;
          description_en: string | null;
          description_vi: string | null;
          id: string;
          is_active: boolean | null;
          logo_url: string | null;
          name: string;
          proficiency_level: string | null;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description_en?: string | null;
          description_vi?: string | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          name: string;
          proficiency_level?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description_en?: string | null;
          description_vi?: string | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          name?: string;
          proficiency_level?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      website_testimonials: {
        Row: {
          client_avatar_url: string | null;
          client_company: string | null;
          client_name: string;
          client_title: string | null;
          created_at: string | null;
          id: string;
          is_published: boolean | null;
          project_id: string | null;
          rating: number | null;
          sort_order: number | null;
          testimonial_en: string;
          testimonial_vi: string;
          updated_at: string | null;
        };
        Insert: {
          client_avatar_url?: string | null;
          client_company?: string | null;
          client_name: string;
          client_title?: string | null;
          created_at?: string | null;
          id?: string;
          is_published?: boolean | null;
          project_id?: string | null;
          rating?: number | null;
          sort_order?: number | null;
          testimonial_en: string;
          testimonial_vi: string;
          updated_at?: string | null;
        };
        Update: {
          client_avatar_url?: string | null;
          client_company?: string | null;
          client_name?: string;
          client_title?: string | null;
          created_at?: string | null;
          id?: string;
          is_published?: boolean | null;
          project_id?: string | null;
          rating?: number | null;
          sort_order?: number | null;
          testimonial_en?: string;
          testimonial_vi?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'website_testimonials_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'website_projects';
            referencedColumns: ['id'];
          },
        ];
      };
      workflow_executions: {
        Row: {
          completed_at: string | null;
          created_by: string | null;
          error_message: string | null;
          execution_time_ms: number | null;
          id: string;
          input_data: Json | null;
          output_data: Json | null;
          started_at: string | null;
          status: string | null;
          workflow_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_by?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          input_data?: Json | null;
          output_data?: Json | null;
          started_at?: string | null;
          status?: string | null;
          workflow_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_by?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          input_data?: Json | null;
          output_data?: Json | null;
          started_at?: string | null;
          status?: string | null;
          workflow_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workflow_executions_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'workflows';
            referencedColumns: ['id'];
          },
        ];
      };
      workflows: {
        Row: {
          agent_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          last_execution: string | null;
          name: string;
          status: string | null;
          steps: Json;
          successful_executions: number | null;
          total_executions: number | null;
          updated_at: string | null;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          last_execution?: string | null;
          name: string;
          status?: string | null;
          steps?: Json;
          successful_executions?: number | null;
          total_executions?: number | null;
          updated_at?: string | null;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          last_execution?: string | null;
          name?: string;
          status?: string | null;
          steps?: Json;
          successful_executions?: number | null;
          total_executions?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workflows_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'ai_agents';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      ai_usage_daily_summary: {
        Row: {
          avg_response_time_ms: number | null;
          content_type: string | null;
          error_count: number | null;
          generation_count: number | null;
          total_cost_usd: number | null;
          total_input_tokens: number | null;
          total_output_tokens: number | null;
          total_tokens: number | null;
          usage_date: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      ai_usage_limits: {
        Row: {
          blogs_today: number | null;
          projects_today: number | null;
          services_today: number | null;
          total_cost_today: number | null;
          total_generations_today: number | null;
          usage_date: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      contacts_with_latest_activity: {
        Row: {
          assigned_to: string | null;
          assigned_to_avatar: string | null;
          assigned_to_name: string | null;
          budget: string | null;
          company: string | null;
          country: string | null;
          created_at: string | null;
          currency: string | null;
          deal_value: number | null;
          email: string | null;
          id: string | null;
          is_archived: boolean | null;
          last_contacted_at: string | null;
          latest_activity: Json | null;
          lead_score: number | null;
          lost_at: string | null;
          lost_reason: string | null;
          message: string | null;
          name: string | null;
          next_follow_up: string | null;
          notes_count: number | null;
          pending_tasks_count: number | null;
          phone: string | null;
          pipeline_stage: string | null;
          priority: string | null;
          service: string | null;
          source: string | null;
          status: string | null;
          subscribe_newsletter: boolean | null;
          tags: string[] | null;
          updated_at: string | null;
          won_at: string | null;
        };
        Relationships: [];
      };
      dashboard_stats: {
        Row: {
          active_tasks: number | null;
          leads_today: number | null;
          overdue_tasks: number | null;
          pipeline_value: number | null;
          total_leads: number | null;
          total_lost: number | null;
          total_revenue: number | null;
          total_won: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      aggregate_daily_ai_stats: {
        Args: { p_date?: string };
        Returns: undefined;
      };
      check_agent_budget: { Args: { p_agent_id: string }; Returns: boolean };
      check_ai_usage_limit: {
        Args: {
          p_content_type: string;
          p_daily_limit?: number;
          p_user_id: string;
        };
        Returns: boolean;
      };
      check_budget_threshold: {
        Args: { p_agent_id: string };
        Returns: undefined;
      };
      create_budget_alert: {
        Args: {
          p_agent_id: string;
          p_alert_type: string;
          p_current_amount?: number;
          p_message: string;
          p_threshold_amount?: number;
        };
        Returns: {
          acknowledged: boolean | null;
          acknowledged_at: string | null;
          agent_id: string | null;
          alert_type: string;
          created_at: string | null;
          current_amount: number | null;
          id: string;
          message: string;
          threshold_amount: number | null;
        };
        SetofOptions: {
          from: '*';
          to: 'budget_alerts';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_remaining_generations: {
        Args: { p_daily_limit?: number; p_user_id: string };
        Returns: {
          blogs_used: number;
          projects_used: number;
          services_used: number;
          total_cost_today: number;
          total_remaining: number;
          total_used: number;
        }[];
      };
      get_user_plan: {
        Args: { p_user_id: string };
        Returns: {
          features: Json;
          limits: Json;
          plan_display_name: string;
          plan_name: string;
          status: string;
        }[];
      };
      has_feature_access: {
        Args: { p_feature_key: string; p_user_id: string };
        Returns: boolean;
      };
      increment_agent_runs: {
        Args: { agent_id: string; success?: boolean };
        Returns: undefined;
      };
      increment_template_usage: {
        Args: { template_id: string };
        Returns: undefined;
      };
      mark_overdue_tasks: { Args: never; Returns: undefined };
      reset_daily_budgets: { Args: never; Returns: undefined };
      reset_monthly_budgets: { Args: never; Returns: undefined };
      track_agent_cost: {
        Args: {
          p_agent_id: string;
          p_cost: number;
          p_model: string;
          p_tokens: number;
        };
        Returns: boolean;
      };
      track_usage: {
        Args: { p_increment?: number; p_metric: string; p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
