-- AI Workspace n8n Integration Tables
-- Tables for storing n8n workflow results

-- News digests table
CREATE TABLE IF NOT EXISTS news_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS news_digests_user_idx ON news_digests(user_id, created_at DESC);

-- Financial summaries table
CREATE TABLE IF NOT EXISTS financial_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS financial_summaries_user_idx ON financial_summaries(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE news_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own news digests"
  ON news_digests FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own financial summaries"
  ON financial_summaries FOR ALL
  USING (auth.uid() = user_id);

