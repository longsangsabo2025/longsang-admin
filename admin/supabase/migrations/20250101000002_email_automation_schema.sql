-- =====================================================
-- EMAIL AUTOMATION SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Created: 2025-11-23
-- Purpose: Complete email automation with templates
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. EMAIL TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(200) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'welcome', 'order-confirmation', 'password-reset', 'newsletter'
    html_content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names: ["user_name", "activation_link"]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. EMAIL QUEUE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES email_templates(id),
    to_email VARCHAR(255) NOT NULL,
    to_name VARCHAR(255),
    subject VARCHAR(200) NOT NULL,
    variables JSONB DEFAULT '{}'::jsonb, -- Key-value pairs: {"user_name": "John", "order_id": "123"}
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sending', 'sent', 'failed'
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. EMAIL LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_queue_id UUID REFERENCES email_queue(id),
    template_type VARCHAR(50),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'sent', 'failed', 'bounced'
    provider VARCHAR(50), -- 'resend', 'gmail', 'sendgrid'
    provider_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. USER REGISTRATIONS TABLE (Example trigger target)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    activation_token VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_user_registrations_email ON user_registrations(email);

-- =====================================================
-- 6. UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers (drop if exists to make idempotent)
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_queue_updated_at ON email_queue;
CREATE TRIGGER update_email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_registrations_updated_at ON user_registrations;
CREATE TRIGGER update_user_registrations_updated_at
    BEFORE UPDATE ON user_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. AUTO-SEND WELCOME EMAIL TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
    welcome_template_id UUID;
BEGIN
    -- Get welcome email template ID
    SELECT id INTO welcome_template_id
    FROM email_templates
    WHERE template_type = 'welcome' AND is_active = true
    LIMIT 1;

    -- Add to email queue
    IF welcome_template_id IS NOT NULL THEN
        INSERT INTO email_queue (
            template_id,
            to_email,
            to_name,
            subject,
            variables
        ) VALUES (
            welcome_template_id,
            NEW.email,
            NEW.name,
            'Welcome to LongSang.org! 🎉',
            jsonb_build_object(
                'user_name', NEW.name,
                'user_email', NEW.email,
                'activation_link', 'https://longsang.org/activate?token=' || NEW.activation_token,
                'company_name', 'LongSang.org',
                'support_email', 'support@longsang.org'
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_registration_send_welcome_email
    AFTER INSERT ON user_registrations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_welcome_email();

-- =====================================================
-- 8. SEED EMAIL TEMPLATES (from existing HTML)
-- =====================================================
-- Note: HTML content will be inserted via Edge Function
-- This is just the schema - actual templates loaded separately

COMMENT ON TABLE email_templates IS 'Stores reusable email templates with variables';
COMMENT ON TABLE email_queue IS 'Queue for emails to be sent (processed by Edge Function)';
COMMENT ON TABLE email_logs IS 'Complete audit log of all sent emails';
COMMENT ON TABLE user_registrations IS 'Example table that triggers welcome emails';
