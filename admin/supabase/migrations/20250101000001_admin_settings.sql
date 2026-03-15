-- Create admin_settings table for storing system configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id TEXT PRIMARY KEY DEFAULT 'system_config',
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admin only in real implementation)
CREATE POLICY "Admin settings access" ON public.admin_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default configuration
INSERT INTO public.admin_settings (id, config) VALUES (
    'system_config',
    '{
        "default_ai_model": "gpt-4o-mini",
        "auto_approve": false,
        "system_wide_logging": true,
        "email_notifications": true,
        "toast_notifications": true,
        "notification_email": "",
        "webhook_url": "",
        "global_daily_limit": 50,
        "global_monthly_limit": 1000,
        "alert_threshold": 75,
        "port_policy": {
            "admin": {"port": 8080, "name": "Admin Dashboard"},
            "ainewbie": {"port": 5174, "name": "AI Newbie Web"},
            "vungtau": {"port": 5175, "name": "Vung Tau Dream Homes"},
            "secretary": {"port": 5173, "name": "AI Secretary"},
            "portfolio": {"port": 5000, "name": "Portfolio"},
            "n8n": {"port": 5678, "name": "N8N Automation"},
            "api": {"port": 3001, "name": "API Server"}
        },
        "last_updated": "2025-01-01T00:00:00Z"
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();