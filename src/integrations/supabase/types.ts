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
          {
            foreignKeyName: 'activities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
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
        Relationships: [
          {
            foreignKeyName: 'ai_usage_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_usage_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
      analytics_daily_summary: {
        Row: {
          avg_page_load_time: number | null;
          avg_time_on_site: number | null;
          bounce_rate: number | null;
          conversion_rate: number | null;
          conversions: number | null;
          created_at: string | null;
          date: string;
          error_count: number | null;
          error_rate: number | null;
          id: string;
          new_visitors: number | null;
          page_views: number | null;
          pages_per_session: number | null;
          product_name: string;
          returning_visitors: number | null;
          unique_visitors: number | null;
          updated_at: string | null;
        };
        Insert: {
          avg_page_load_time?: number | null;
          avg_time_on_site?: number | null;
          bounce_rate?: number | null;
          conversion_rate?: number | null;
          conversions?: number | null;
          created_at?: string | null;
          date: string;
          error_count?: number | null;
          error_rate?: number | null;
          id?: string;
          new_visitors?: number | null;
          page_views?: number | null;
          pages_per_session?: number | null;
          product_name: string;
          returning_visitors?: number | null;
          unique_visitors?: number | null;
          updated_at?: string | null;
        };
        Update: {
          avg_page_load_time?: number | null;
          avg_time_on_site?: number | null;
          bounce_rate?: number | null;
          conversion_rate?: number | null;
          conversions?: number | null;
          created_at?: string | null;
          date?: string;
          error_count?: number | null;
          error_rate?: number | null;
          id?: string;
          new_visitors?: number | null;
          page_views?: number | null;
          pages_per_session?: number | null;
          product_name?: string;
          returning_visitors?: number | null;
          unique_visitors?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          anonymous_id: string | null;
          browser: string | null;
          city: string | null;
          country: string | null;
          created_at: string | null;
          device_type: string | null;
          event_category: string | null;
          event_name: string;
          event_type: string;
          id: string;
          os: string | null;
          page_load_time: number | null;
          page_title: string | null;
          page_url: string | null;
          product_name: string;
          properties: Json | null;
          referrer: string | null;
          session_id: string | null;
          time_on_page: number | null;
          user_id: string | null;
        };
        Insert: {
          anonymous_id?: string | null;
          browser?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          device_type?: string | null;
          event_category?: string | null;
          event_name: string;
          event_type: string;
          id?: string;
          os?: string | null;
          page_load_time?: number | null;
          page_title?: string | null;
          page_url?: string | null;
          product_name: string;
          properties?: Json | null;
          referrer?: string | null;
          session_id?: string | null;
          time_on_page?: number | null;
          user_id?: string | null;
        };
        Update: {
          anonymous_id?: string | null;
          browser?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          device_type?: string | null;
          event_category?: string | null;
          event_name?: string;
          event_type?: string;
          id?: string;
          os?: string | null;
          page_load_time?: number | null;
          page_title?: string | null;
          page_url?: string | null;
          product_name?: string;
          properties?: Json | null;
          referrer?: string | null;
          session_id?: string | null;
          time_on_page?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'analytics_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
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
      app_showcase: {
        Row: {
          app_id: string;
          app_name: string;
          branding: Json;
          created_at: string | null;
          created_by: string | null;
          cta: Json;
          description: string | null;
          downloads: Json;
          features: Json;
          hero: Json;
          icon: string | null;
          id: string;
          production_url: string | null;
          published_at: string | null;
          slug: string | null;
          social: Json;
          status: string | null;
          tagline: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          app_id: string;
          app_name: string;
          branding?: Json;
          created_at?: string | null;
          created_by?: string | null;
          cta?: Json;
          description?: string | null;
          downloads?: Json;
          features?: Json;
          hero?: Json;
          icon?: string | null;
          id?: string;
          production_url?: string | null;
          published_at?: string | null;
          slug?: string | null;
          social?: Json;
          status?: string | null;
          tagline?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          app_id?: string;
          app_name?: string;
          branding?: Json;
          created_at?: string | null;
          created_by?: string | null;
          cta?: Json;
          description?: string | null;
          downloads?: Json;
          features?: Json;
          hero?: Json;
          icon?: string | null;
          id?: string;
          production_url?: string | null;
          published_at?: string | null;
          slug?: string | null;
          social?: Json;
          status?: string | null;
          tagline?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'app_showcase_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_showcase_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_showcase_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_showcase_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
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
          {
            foreignKeyName: 'attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      automated_workflows: {
        Row: {
          created_at: string | null;
          description: string | null;
          error_count: number | null;
          execution_count: number | null;
          id: string;
          is_active: boolean | null;
          is_paused: boolean | null;
          last_executed_at: string | null;
          n8n_workflow_id: string;
          name: string;
          success_count: number | null;
          trigger_config: Json | null;
          trigger_type: string | null;
          updated_at: string | null;
          user_id: string | null;
          workflow_type: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          error_count?: number | null;
          execution_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_paused?: boolean | null;
          last_executed_at?: string | null;
          n8n_workflow_id: string;
          name: string;
          success_count?: number | null;
          trigger_config?: Json | null;
          trigger_type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          workflow_type: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          error_count?: number | null;
          execution_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_paused?: boolean | null;
          last_executed_at?: string | null;
          n8n_workflow_id?: string;
          name?: string;
          success_count?: number | null;
          trigger_config?: Json | null;
          trigger_type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          workflow_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'automated_workflows_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'automated_workflows_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
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
        Relationships: [
          {
            foreignKeyName: 'automation_rules_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'automation_rules_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'availability_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'availability_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
      campaign_posts: {
        Row: {
          campaign_id: string | null;
          clicks: number | null;
          comments: number | null;
          content: string | null;
          created_at: string | null;
          engagement: number | null;
          error_message: string | null;
          id: string;
          image_url: string | null;
          impressions: number | null;
          likes: number | null;
          platform: string;
          post_id: string | null;
          post_url: string | null;
          posted_at: string | null;
          reach: number | null;
          retry_count: number | null;
          shares: number | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          campaign_id?: string | null;
          clicks?: number | null;
          comments?: number | null;
          content?: string | null;
          created_at?: string | null;
          engagement?: number | null;
          error_message?: string | null;
          id?: string;
          image_url?: string | null;
          impressions?: number | null;
          likes?: number | null;
          platform: string;
          post_id?: string | null;
          post_url?: string | null;
          posted_at?: string | null;
          reach?: number | null;
          retry_count?: number | null;
          shares?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          campaign_id?: string | null;
          clicks?: number | null;
          comments?: number | null;
          content?: string | null;
          created_at?: string | null;
          engagement?: number | null;
          error_message?: string | null;
          id?: string;
          image_url?: string | null;
          impressions?: number | null;
          likes?: number | null;
          platform?: string;
          post_id?: string | null;
          post_url?: string | null;
          posted_at?: string | null;
          reach?: number | null;
          retry_count?: number | null;
          shares?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'campaign_posts_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'marketing_campaigns';
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
        Relationships: [
          {
            foreignKeyName: 'consultations_consultant_id_fkey';
            columns: ['consultant_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'consultations_consultant_id_fkey';
            columns: ['consultant_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'contacts_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contacts_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      content_library: {
        Row: {
          ai_prompt: string | null;
          avg_engagement: number | null;
          best_platform: string | null;
          category: string | null;
          content: string;
          content_type: string | null;
          created_at: string | null;
          id: string;
          image_url: string | null;
          is_ai_generated: boolean | null;
          last_used_at: string | null;
          media_urls: string[] | null;
          tags: string[] | null;
          title: string | null;
          updated_at: string | null;
          used_count: number | null;
          user_id: string | null;
          video_url: string | null;
        };
        Insert: {
          ai_prompt?: string | null;
          avg_engagement?: number | null;
          best_platform?: string | null;
          category?: string | null;
          content: string;
          content_type?: string | null;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_ai_generated?: boolean | null;
          last_used_at?: string | null;
          media_urls?: string[] | null;
          tags?: string[] | null;
          title?: string | null;
          updated_at?: string | null;
          used_count?: number | null;
          user_id?: string | null;
          video_url?: string | null;
        };
        Update: {
          ai_prompt?: string | null;
          avg_engagement?: number | null;
          best_platform?: string | null;
          category?: string | null;
          content?: string;
          content_type?: string | null;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_ai_generated?: boolean | null;
          last_used_at?: string | null;
          media_urls?: string[] | null;
          tags?: string[] | null;
          title?: string | null;
          updated_at?: string | null;
          used_count?: number | null;
          user_id?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'content_library_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'content_library_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'credentials_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credentials_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      credentials_vault: {
        Row: {
          category: string;
          created_at: string | null;
          created_by: string | null;
          credential_preview: string | null;
          credential_type: string;
          credential_value: string;
          dashboard_url: string | null;
          description: string | null;
          docs_url: string | null;
          environment: string | null;
          expires_at: string | null;
          id: string;
          last_rotated_at: string | null;
          last_used_at: string | null;
          name: string;
          notes: string | null;
          project_id: string | null;
          provider: string | null;
          rotation_reminder_days: number | null;
          status: string | null;
          tags: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          created_by?: string | null;
          credential_preview?: string | null;
          credential_type: string;
          credential_value: string;
          dashboard_url?: string | null;
          description?: string | null;
          docs_url?: string | null;
          environment?: string | null;
          expires_at?: string | null;
          id?: string;
          last_rotated_at?: string | null;
          last_used_at?: string | null;
          name: string;
          notes?: string | null;
          project_id?: string | null;
          provider?: string | null;
          rotation_reminder_days?: number | null;
          status?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          created_by?: string | null;
          credential_preview?: string | null;
          credential_type?: string;
          credential_value?: string;
          dashboard_url?: string | null;
          description?: string | null;
          docs_url?: string | null;
          environment?: string | null;
          expires_at?: string | null;
          id?: string;
          last_rotated_at?: string | null;
          last_used_at?: string | null;
          name?: string;
          notes?: string | null;
          project_id?: string | null;
          provider?: string | null;
          rotation_reminder_days?: number | null;
          status?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'credentials_vault_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credentials_vault_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credentials_vault_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      email_campaigns: {
        Row: {
          bounced_count: number | null;
          campaign_id: string | null;
          clicked_count: number | null;
          content: string;
          created_at: string | null;
          delivered_count: number | null;
          id: string;
          mautic_campaign_id: string | null;
          opened_count: number | null;
          recipient_list_id: string | null;
          recipient_type: string | null;
          recipients_count: number | null;
          scheduled_at: string | null;
          sent_at: string | null;
          sent_count: number | null;
          status: string | null;
          subject: string;
          template_id: string | null;
          unsubscribed_count: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          bounced_count?: number | null;
          campaign_id?: string | null;
          clicked_count?: number | null;
          content: string;
          created_at?: string | null;
          delivered_count?: number | null;
          id?: string;
          mautic_campaign_id?: string | null;
          opened_count?: number | null;
          recipient_list_id?: string | null;
          recipient_type?: string | null;
          recipients_count?: number | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          sent_count?: number | null;
          status?: string | null;
          subject: string;
          template_id?: string | null;
          unsubscribed_count?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          bounced_count?: number | null;
          campaign_id?: string | null;
          clicked_count?: number | null;
          content?: string;
          created_at?: string | null;
          delivered_count?: number | null;
          id?: string;
          mautic_campaign_id?: string | null;
          opened_count?: number | null;
          recipient_list_id?: string | null;
          recipient_type?: string | null;
          recipients_count?: number | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          sent_count?: number | null;
          status?: string | null;
          subject?: string;
          template_id?: string | null;
          unsubscribed_count?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_campaigns_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'marketing_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_campaigns_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_campaigns_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      email_logs: {
        Row: {
          created_at: string | null;
          email_queue_id: string | null;
          error_message: string | null;
          id: string;
          provider: string | null;
          provider_message_id: string | null;
          sent_at: string | null;
          status: string;
          subject: string;
          template_type: string | null;
          to_email: string;
        };
        Insert: {
          created_at?: string | null;
          email_queue_id?: string | null;
          error_message?: string | null;
          id?: string;
          provider?: string | null;
          provider_message_id?: string | null;
          sent_at?: string | null;
          status: string;
          subject: string;
          template_type?: string | null;
          to_email: string;
        };
        Update: {
          created_at?: string | null;
          email_queue_id?: string | null;
          error_message?: string | null;
          id?: string;
          provider?: string | null;
          provider_message_id?: string | null;
          sent_at?: string | null;
          status?: string;
          subject?: string;
          template_type?: string | null;
          to_email?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_logs_email_queue_id_fkey';
            columns: ['email_queue_id'];
            isOneToOne: false;
            referencedRelation: 'email_queue';
            referencedColumns: ['id'];
          },
        ];
      };
      email_queue: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          id: string;
          max_retries: number | null;
          retry_count: number | null;
          scheduled_at: string | null;
          sent_at: string | null;
          status: string | null;
          subject: string;
          template_id: string | null;
          to_email: string;
          to_name: string | null;
          updated_at: string | null;
          variables: Json | null;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          max_retries?: number | null;
          retry_count?: number | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: string | null;
          subject: string;
          template_id?: string | null;
          to_email: string;
          to_name?: string | null;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          max_retries?: number | null;
          retry_count?: number | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: string | null;
          subject?: string;
          template_id?: string | null;
          to_email?: string;
          to_name?: string | null;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_queue_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'email_templates';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'email_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
      funnel_analytics: {
        Row: {
          conversion_rate: number | null;
          created_at: string | null;
          date: string;
          funnel_name: string;
          id: string;
          product_name: string;
          step_name: string;
          step_number: number;
          users_completed: number | null;
          users_entered: number | null;
        };
        Insert: {
          conversion_rate?: number | null;
          created_at?: string | null;
          date: string;
          funnel_name: string;
          id?: string;
          product_name: string;
          step_name: string;
          step_number: number;
          users_completed?: number | null;
          users_entered?: number | null;
        };
        Update: {
          conversion_rate?: number | null;
          created_at?: string | null;
          date?: string;
          funnel_name?: string;
          id?: string;
          product_name?: string;
          step_name?: string;
          step_number?: number;
          users_completed?: number | null;
          users_entered?: number | null;
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
        Relationships: [
          {
            foreignKeyName: 'google_reports_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'google_reports_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'google_services_config_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'google_services_config_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'google_sync_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'google_sync_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      inbound_emails: {
        Row: {
          body_html: string | null;
          body_text: string | null;
          from_email: string;
          id: string;
          processed: boolean | null;
          processing_error: string | null;
          raw_email: Json | null;
          received_at: string | null;
          subject: string | null;
          ticket_id: string | null;
          to_email: string;
        };
        Insert: {
          body_html?: string | null;
          body_text?: string | null;
          from_email: string;
          id?: string;
          processed?: boolean | null;
          processing_error?: string | null;
          raw_email?: Json | null;
          received_at?: string | null;
          subject?: string | null;
          ticket_id?: string | null;
          to_email: string;
        };
        Update: {
          body_html?: string | null;
          body_text?: string | null;
          from_email?: string;
          id?: string;
          processed?: boolean | null;
          processing_error?: string | null;
          raw_email?: Json | null;
          received_at?: string | null;
          subject?: string | null;
          ticket_id?: string | null;
          to_email?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inbound_emails_ticket_id_fkey';
            columns: ['ticket_id'];
            isOneToOne: false;
            referencedRelation: 'support_tickets';
            referencedColumns: ['id'];
          },
        ];
      };
      investment_applications: {
        Row: {
          address: string;
          admin_notes: string | null;
          agree_privacy: boolean;
          agree_risk: boolean;
          agree_terms: boolean;
          company_name: string | null;
          created_at: string | null;
          email: string;
          full_name: string;
          id: string;
          identity_document: string;
          investment_amount: number;
          investment_experience: string;
          investment_purpose: string;
          investor_type: string;
          phone: string;
          project_id: number;
          project_name: string;
          project_slug: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          risk_tolerance: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          address: string;
          admin_notes?: string | null;
          agree_privacy?: boolean;
          agree_risk?: boolean;
          agree_terms?: boolean;
          company_name?: string | null;
          created_at?: string | null;
          email: string;
          full_name: string;
          id?: string;
          identity_document: string;
          investment_amount: number;
          investment_experience: string;
          investment_purpose: string;
          investor_type: string;
          phone: string;
          project_id: number;
          project_name: string;
          project_slug: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          risk_tolerance: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          address?: string;
          admin_notes?: string | null;
          agree_privacy?: boolean;
          agree_risk?: boolean;
          agree_terms?: boolean;
          company_name?: string | null;
          created_at?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          identity_document?: string;
          investment_amount?: number;
          investment_experience?: string;
          investment_purpose?: string;
          investor_type?: string;
          phone?: string;
          project_id?: number;
          project_name?: string;
          project_slug?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          risk_tolerance?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'investment_applications_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'investment_applications_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      live_session_attendees: {
        Row: {
          attendance_duration_minutes: number | null;
          id: string;
          joined_at: string | null;
          left_at: string | null;
          registered_at: string | null;
          session_id: string;
          user_id: string;
        };
        Insert: {
          attendance_duration_minutes?: number | null;
          id?: string;
          joined_at?: string | null;
          left_at?: string | null;
          registered_at?: string | null;
          session_id: string;
          user_id: string;
        };
        Update: {
          attendance_duration_minutes?: number | null;
          id?: string;
          joined_at?: string | null;
          left_at?: string | null;
          registered_at?: string | null;
          session_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_attendee';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_attendee';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_session';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'live_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      live_sessions: {
        Row: {
          created_at: string | null;
          current_attendees: number | null;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          instructor_id: string | null;
          is_completed: boolean | null;
          max_attendees: number | null;
          meeting_url: string | null;
          recording_url: string | null;
          scheduled_at: string;
          session_type: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_attendees?: number | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          instructor_id?: string | null;
          is_completed?: boolean | null;
          max_attendees?: number | null;
          meeting_url?: string | null;
          recording_url?: string | null;
          scheduled_at: string;
          session_type: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_attendees?: number | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          instructor_id?: string | null;
          is_completed?: boolean | null;
          max_attendees?: number | null;
          meeting_url?: string | null;
          recording_url?: string | null;
          scheduled_at?: string;
          session_type?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_instructor';
            columns: ['instructor_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_instructor';
            columns: ['instructor_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      marketing_campaigns: {
        Row: {
          completed_at: string | null;
          content: string | null;
          created_at: string | null;
          id: string;
          n8n_execution_id: string | null;
          n8n_workflow_id: string | null;
          name: string;
          platforms: string[] | null;
          scheduled_at: string | null;
          started_at: string | null;
          status: string | null;
          target_audience: Json | null;
          type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          content?: string | null;
          created_at?: string | null;
          id?: string;
          n8n_execution_id?: string | null;
          n8n_workflow_id?: string | null;
          name: string;
          platforms?: string[] | null;
          scheduled_at?: string | null;
          started_at?: string | null;
          status?: string | null;
          target_audience?: Json | null;
          type: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          content?: string | null;
          created_at?: string | null;
          id?: string;
          n8n_execution_id?: string | null;
          n8n_workflow_id?: string | null;
          name?: string;
          platforms?: string[] | null;
          scheduled_at?: string | null;
          started_at?: string | null;
          status?: string | null;
          target_audience?: Json | null;
          type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'marketing_campaigns_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marketing_campaigns_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      marketing_leads: {
        Row: {
          campaign_id: string | null;
          company: string | null;
          contact_count: number | null;
          created_at: string | null;
          custom_fields: Json | null;
          email: string;
          first_contact_at: string | null;
          id: string;
          interests: string[] | null;
          last_contact_at: string | null;
          lead_score: number | null;
          lead_status: string | null;
          name: string | null;
          nurturing_status: string | null;
          nurturing_workflow_id: string | null;
          phone: string | null;
          source: string | null;
          tags: string[] | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          campaign_id?: string | null;
          company?: string | null;
          contact_count?: number | null;
          created_at?: string | null;
          custom_fields?: Json | null;
          email: string;
          first_contact_at?: string | null;
          id?: string;
          interests?: string[] | null;
          last_contact_at?: string | null;
          lead_score?: number | null;
          lead_status?: string | null;
          name?: string | null;
          nurturing_status?: string | null;
          nurturing_workflow_id?: string | null;
          phone?: string | null;
          source?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          campaign_id?: string | null;
          company?: string | null;
          contact_count?: number | null;
          created_at?: string | null;
          custom_fields?: Json | null;
          email?: string;
          first_contact_at?: string | null;
          id?: string;
          interests?: string[] | null;
          last_contact_at?: string | null;
          lead_score?: number | null;
          lead_status?: string | null;
          name?: string | null;
          nurturing_status?: string | null;
          nurturing_workflow_id?: string | null;
          phone?: string | null;
          source?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'marketing_leads_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'marketing_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marketing_leads_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marketing_leads_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      marketing_workflow_executions: {
        Row: {
          campaign_id: string | null;
          created_at: string | null;
          duration_ms: number | null;
          error_message: string | null;
          execution_id: string;
          finished_at: string | null;
          id: string;
          input_data: Json | null;
          output_data: Json | null;
          started_at: string | null;
          status: string | null;
          user_id: string | null;
          workflow_id: string;
          workflow_name: string;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          execution_id: string;
          finished_at?: string | null;
          id?: string;
          input_data?: Json | null;
          output_data?: Json | null;
          started_at?: string | null;
          status?: string | null;
          user_id?: string | null;
          workflow_id: string;
          workflow_name: string;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          execution_id?: string;
          finished_at?: string | null;
          id?: string;
          input_data?: Json | null;
          output_data?: Json | null;
          started_at?: string | null;
          status?: string | null;
          user_id?: string | null;
          workflow_id?: string;
          workflow_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'marketing_workflow_executions_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'marketing_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marketing_workflow_executions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marketing_workflow_executions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
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
        Relationships: [
          {
            foreignKeyName: 'n8n_workflow_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'n8n_workflow_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
          {
            foreignKeyName: 'notes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
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
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
          {
            foreignKeyName: 'payment_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
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
      product_metrics: {
        Row: {
          active_users: number | null;
          avg_response_time: number | null;
          error_rate: number | null;
          feature_usage: Json | null;
          id: string;
          monthly_active_users: number | null;
          monthly_revenue: number | null;
          product_name: string;
          total_revenue: number | null;
          total_users: number | null;
          updated_at: string | null;
          uptime_percentage: number | null;
        };
        Insert: {
          active_users?: number | null;
          avg_response_time?: number | null;
          error_rate?: number | null;
          feature_usage?: Json | null;
          id?: string;
          monthly_active_users?: number | null;
          monthly_revenue?: number | null;
          product_name: string;
          total_revenue?: number | null;
          total_users?: number | null;
          updated_at?: string | null;
          uptime_percentage?: number | null;
        };
        Update: {
          active_users?: number | null;
          avg_response_time?: number | null;
          error_rate?: number | null;
          feature_usage?: Json | null;
          id?: string;
          monthly_active_users?: number | null;
          monthly_revenue?: number | null;
          product_name?: string;
          total_revenue?: number | null;
          total_users?: number | null;
          updated_at?: string | null;
          uptime_percentage?: number | null;
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
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      project_interests: {
        Row: {
          contacted_at: string | null;
          contacted_by: string | null;
          created_at: string | null;
          email: string;
          full_name: string;
          id: string;
          message: string | null;
          phone: string;
          project_id: number;
          project_name: string;
          project_slug: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          contacted_at?: string | null;
          contacted_by?: string | null;
          created_at?: string | null;
          email: string;
          full_name: string;
          id?: string;
          message?: string | null;
          phone: string;
          project_id: number;
          project_name: string;
          project_slug: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          contacted_at?: string | null;
          contacted_by?: string | null;
          created_at?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          message?: string | null;
          phone?: string;
          project_id?: number;
          project_name?: string;
          project_slug?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'project_interests_contacted_by_fkey';
            columns: ['contacted_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_interests_contacted_by_fkey';
            columns: ['contacted_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      project_submissions: {
        Row: {
          ai_review: Json | null;
          course_id: string;
          created_at: string | null;
          demo_url: string | null;
          description: string | null;
          github_url: string | null;
          grade: number | null;
          id: string;
          instructor_feedback: string | null;
          lesson_id: string;
          reviewed_at: string | null;
          screenshots: Json | null;
          status: string | null;
          submission_files: Json | null;
          submitted_at: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
          xp_awarded: number | null;
        };
        Insert: {
          ai_review?: Json | null;
          course_id: string;
          created_at?: string | null;
          demo_url?: string | null;
          description?: string | null;
          github_url?: string | null;
          grade?: number | null;
          id?: string;
          instructor_feedback?: string | null;
          lesson_id: string;
          reviewed_at?: string | null;
          screenshots?: Json | null;
          status?: string | null;
          submission_files?: Json | null;
          submitted_at?: string | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
          xp_awarded?: number | null;
        };
        Update: {
          ai_review?: Json | null;
          course_id?: string;
          created_at?: string | null;
          demo_url?: string | null;
          description?: string | null;
          github_url?: string | null;
          grade?: number | null;
          id?: string;
          instructor_feedback?: string | null;
          lesson_id?: string;
          reviewed_at?: string | null;
          screenshots?: Json | null;
          status?: string | null;
          submission_files?: Json | null;
          submitted_at?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
          xp_awarded?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_submission_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_submission_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          budget_usd: number | null;
          color: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          github_url: string | null;
          icon: string | null;
          id: string;
          local_url: string | null;
          metadata: Json | null;
          name: string;
          production_url: string | null;
          slug: string | null;
          spent_usd: number | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          budget_usd?: number | null;
          color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          github_url?: string | null;
          icon?: string | null;
          id?: string;
          local_url?: string | null;
          metadata?: Json | null;
          name: string;
          production_url?: string | null;
          slug?: string | null;
          spent_usd?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          budget_usd?: number | null;
          color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          github_url?: string | null;
          icon?: string | null;
          id?: string;
          local_url?: string | null;
          metadata?: Json | null;
          name?: string;
          production_url?: string | null;
          slug?: string | null;
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
        Relationships: [
          {
            foreignKeyName: 'seo_domains_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'seo_domains_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
      social_media_accounts: {
        Row: {
          access_token: string | null;
          account_id: string;
          account_name: string | null;
          account_url: string | null;
          connected_at: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          is_verified: boolean | null;
          last_sync_at: string | null;
          platform: string;
          refresh_token: string | null;
          token_expires_at: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          access_token?: string | null;
          account_id: string;
          account_name?: string | null;
          account_url?: string | null;
          connected_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          last_sync_at?: string | null;
          platform: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          access_token?: string | null;
          account_id?: string;
          account_name?: string | null;
          account_url?: string | null;
          connected_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          last_sync_at?: string | null;
          platform?: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'social_media_accounts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'social_media_accounts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      social_media_credentials: {
        Row: {
          account_info: Json | null;
          created_at: string | null;
          credentials: Json;
          id: string;
          is_active: boolean | null;
          last_error: string | null;
          last_tested_at: string | null;
          platform: string;
          settings: Json | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          account_info?: Json | null;
          created_at?: string | null;
          credentials: Json;
          id?: string;
          is_active?: boolean | null;
          last_error?: string | null;
          last_tested_at?: string | null;
          platform: string;
          settings?: Json | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          account_info?: Json | null;
          created_at?: string | null;
          credentials?: Json;
          id?: string;
          is_active?: boolean | null;
          last_error?: string | null;
          last_tested_at?: string | null;
          platform?: string;
          settings?: Json | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'social_media_credentials_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'social_media_credentials_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      student_revenue: {
        Row: {
          amount: number;
          client_name: string | null;
          created_at: string | null;
          currency: string | null;
          earned_at: string | null;
          id: string;
          metadata: Json | null;
          project_description: string | null;
          revenue_source: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          client_name?: string | null;
          created_at?: string | null;
          currency?: string | null;
          earned_at?: string | null;
          id?: string;
          metadata?: Json | null;
          project_description?: string | null;
          revenue_source: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          client_name?: string | null;
          created_at?: string | null;
          currency?: string | null;
          earned_at?: string | null;
          id?: string;
          metadata?: Json | null;
          project_description?: string | null;
          revenue_source?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_revenue_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_revenue_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      study_group_members: {
        Row: {
          group_id: string;
          id: string;
          joined_at: string | null;
          last_active_at: string | null;
          role: string | null;
          user_id: string;
        };
        Insert: {
          group_id: string;
          id?: string;
          joined_at?: string | null;
          last_active_at?: string | null;
          role?: string | null;
          user_id: string;
        };
        Update: {
          group_id?: string;
          id?: string;
          joined_at?: string | null;
          last_active_at?: string | null;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_group';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'study_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_member';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_member';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      study_groups: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          current_members: number | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          level: string;
          max_members: number | null;
          meeting_schedule: string | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          current_members?: number | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          level: string;
          max_members?: number | null;
          meeting_schedule?: string | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          current_members?: number | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          level?: string;
          max_members?: number | null;
          meeting_schedule?: string | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_creator';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_creator';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
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
      support_tickets: {
        Row: {
          assigned_to: string | null;
          category: string | null;
          created_at: string | null;
          customer_email: string;
          customer_name: string | null;
          first_response_at: string | null;
          id: string;
          metadata: Json | null;
          priority: string | null;
          resolved_at: string | null;
          sla_deadline: string | null;
          status: string | null;
          subject: string;
          ticket_number: string;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          category?: string | null;
          created_at?: string | null;
          customer_email: string;
          customer_name?: string | null;
          first_response_at?: string | null;
          id?: string;
          metadata?: Json | null;
          priority?: string | null;
          resolved_at?: string | null;
          sla_deadline?: string | null;
          status?: string | null;
          subject: string;
          ticket_number: string;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          category?: string | null;
          created_at?: string | null;
          customer_email?: string;
          customer_name?: string | null;
          first_response_at?: string | null;
          id?: string;
          metadata?: Json | null;
          priority?: string | null;
          resolved_at?: string | null;
          sla_deadline?: string | null;
          status?: string | null;
          subject?: string;
          ticket_number?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'support_tickets_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_tickets_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
            foreignKeyName: 'tasks_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_completed_by_fkey';
            columns: ['completed_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_completed_by_fkey';
            columns: ['completed_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
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
          {
            foreignKeyName: 'tasks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      ticket_messages: {
        Row: {
          attachments: Json | null;
          body_html: string | null;
          body_text: string | null;
          created_at: string | null;
          from_email: string;
          id: string;
          is_from_customer: boolean | null;
          message_type: string | null;
          metadata: Json | null;
          subject: string | null;
          ticket_id: string | null;
          to_email: string;
        };
        Insert: {
          attachments?: Json | null;
          body_html?: string | null;
          body_text?: string | null;
          created_at?: string | null;
          from_email: string;
          id?: string;
          is_from_customer?: boolean | null;
          message_type?: string | null;
          metadata?: Json | null;
          subject?: string | null;
          ticket_id?: string | null;
          to_email: string;
        };
        Update: {
          attachments?: Json | null;
          body_html?: string | null;
          body_text?: string | null;
          created_at?: string | null;
          from_email?: string;
          id?: string;
          is_from_customer?: boolean | null;
          message_type?: string | null;
          metadata?: Json | null;
          subject?: string | null;
          ticket_id?: string | null;
          to_email?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ticket_messages_ticket_id_fkey';
            columns: ['ticket_id'];
            isOneToOne: false;
            referencedRelation: 'support_tickets';
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
        Relationships: [
          {
            foreignKeyName: 'unavailable_dates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'unavailable_dates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'usage_tracking_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'usage_tracking_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      user_achievements: {
        Row: {
          achievement_name: string;
          achievement_type: string;
          created_at: string | null;
          earned_at: string | null;
          id: string;
          metadata: Json | null;
          user_id: string;
          xp_awarded: number | null;
        };
        Insert: {
          achievement_name: string;
          achievement_type: string;
          created_at?: string | null;
          earned_at?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id: string;
          xp_awarded?: number | null;
        };
        Update: {
          achievement_name?: string;
          achievement_type?: string;
          created_at?: string | null;
          earned_at?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id?: string;
          xp_awarded?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activity_log: {
        Row: {
          activity_data: Json | null;
          activity_type: string;
          created_at: string | null;
          id: string;
          ip_address: unknown;
          product_name: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          activity_data?: Json | null;
          activity_type: string;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          product_name: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          activity_data?: Json | null;
          activity_type?: string;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          product_name?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activity_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activity_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
          {
            foreignKeyName: 'user_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      user_xp: {
        Row: {
          current_level: number | null;
          id: string;
          total_achievements: number | null;
          total_courses_completed: number | null;
          total_revenue_generated: number | null;
          total_xp: number | null;
          updated_at: string | null;
          user_id: string;
          xp_to_next_level: number | null;
        };
        Insert: {
          current_level?: number | null;
          id?: string;
          total_achievements?: number | null;
          total_courses_completed?: number | null;
          total_revenue_generated?: number | null;
          total_xp?: number | null;
          updated_at?: string | null;
          user_id: string;
          xp_to_next_level?: number | null;
        };
        Update: {
          current_level?: number | null;
          id?: string;
          total_achievements?: number | null;
          total_courses_completed?: number | null;
          total_revenue_generated?: number | null;
          total_xp?: number | null;
          updated_at?: string | null;
          user_id?: string;
          xp_to_next_level?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_user_xp';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_user_xp';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      web_vitals_metrics: {
        Row: {
          created_at: string | null;
          id: string;
          metric_name: string;
          metric_value: number;
          page_url: string;
          rating: string | null;
          recorded_at: string | null;
          user_agent: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          metric_name: string;
          metric_value: number;
          page_url: string;
          rating?: string | null;
          recorded_at?: string | null;
          user_agent?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          metric_name?: string;
          metric_value?: number;
          page_url?: string;
          rating?: string | null;
          recorded_at?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: 'website_blog_posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'website_blog_posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'website_projects_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'website_projects_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'website_services_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'website_services_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'ai_usage_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_usage_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'ai_usage_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_usage_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
      };
      analytics_24h_overview: {
        Row: {
          avg_load_time: number | null;
          error_count: number | null;
          product_name: string | null;
          sessions: number | null;
          total_events: number | null;
          unique_users: number | null;
        };
        Relationships: [];
      };
      app_showcase_published: {
        Row: {
          app_id: string | null;
          app_name: string | null;
          branding: Json | null;
          cta: Json | null;
          description: string | null;
          downloads: Json | null;
          features: Json | null;
          hero: Json | null;
          id: string | null;
          published_at: string | null;
          social: Json | null;
          tagline: string | null;
          updated_at: string | null;
        };
        Insert: {
          app_id?: string | null;
          app_name?: string | null;
          branding?: Json | null;
          cta?: Json | null;
          description?: string | null;
          downloads?: Json | null;
          features?: Json | null;
          hero?: Json | null;
          id?: string | null;
          published_at?: string | null;
          social?: Json | null;
          tagline?: string | null;
          updated_at?: string | null;
        };
        Update: {
          app_id?: string | null;
          app_name?: string | null;
          branding?: Json | null;
          cta?: Json | null;
          description?: string | null;
          downloads?: Json | null;
          features?: Json | null;
          hero?: Json | null;
          id?: string | null;
          published_at?: string | null;
          social?: Json | null;
          tagline?: string | null;
          updated_at?: string | null;
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
        Relationships: [
          {
            foreignKeyName: 'contacts_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_revenue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contacts_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_xp';
            referencedColumns: ['id'];
          },
        ];
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
      leaderboard_revenue: {
        Row: {
          avatar_url: string | null;
          current_level: number | null;
          email: string | null;
          full_name: string | null;
          id: string | null;
          rank: number | null;
          total_revenue_generated: number | null;
          total_xp: number | null;
        };
        Relationships: [];
      };
      leaderboard_xp: {
        Row: {
          avatar_url: string | null;
          current_level: number | null;
          email: string | null;
          full_name: string | null;
          id: string | null;
          rank: number | null;
          total_achievements: number | null;
          total_courses_completed: number | null;
          total_xp: number | null;
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
      exec_raw_sql: { Args: { query: string }; Returns: Json };
      exec_safe_sql: { Args: { query: string }; Returns: Json };
      generate_ticket_number: { Args: never; Returns: string };
      get_daily_stats: {
        Args: { p_days?: number; p_product_name: string };
        Returns: {
          avg_time: number;
          conversions: number;
          date: string;
          page_views: number;
          unique_visitors: number;
        }[];
      };
      get_product_overview: {
        Args: { p_product_name?: string };
        Returns: {
          active_users: number;
          avg_response_time: number;
          error_rate: number;
          product: string;
          total_users: number;
          uptime: number;
        }[];
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
      track_analytics_event: {
        Args: {
          p_event_name: string;
          p_event_type: string;
          p_product_name: string;
          p_properties?: Json;
          p_session_id?: string;
          p_user_id?: string;
        };
        Returns: string;
      };
      track_usage: {
        Args: { p_increment?: number; p_metric: string; p_user_id: string };
        Returns: undefined;
      };
      update_product_metrics: {
        Args: {
          p_active_users?: number;
          p_error_rate?: number;
          p_product_name: string;
          p_response_time?: number;
          p_uptime?: number;
        };
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
