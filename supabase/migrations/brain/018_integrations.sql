-- ================================================
-- Phase 6B - Integration Layer
-- ================================================
-- External integrations: Slack, email, webhooks, import/export

-- Integrations Table
CREATE TABLE public.brain_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_type TEXT NOT NULL, -- 'slack', 'email', 'webhook', 'notion', etc.
  config JSONB DEFAULT '{}'::jsonb, -- API keys, webhook URLs, credentials (encrypted)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brain_integrations_user_id ON public.brain_integrations(user_id);
CREATE INDEX idx_brain_integrations_type ON public.brain_integrations(integration_type);
CREATE INDEX idx_brain_integrations_active ON public.brain_integrations(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE public.brain_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own integrations"
  ON public.brain_integrations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_brain_integrations BEFORE UPDATE ON public.brain_integrations
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

-- Comments
COMMENT ON TABLE public.brain_integrations IS 'External integrations configuration for users';

