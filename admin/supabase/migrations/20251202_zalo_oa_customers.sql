-- =====================================================
-- ZALO OA CUSTOMERS - Database Schema
-- For SABO Billiards Customer Management
-- Created: 2025-12-02
-- =====================================================

-- Zalo OA Configuration
CREATE TABLE IF NOT EXISTS zalo_oa_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oa_id TEXT NOT NULL,
  oa_name TEXT NOT NULL,
  app_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  business_name TEXT NOT NULL,
  business_phone TEXT,
  business_address TEXT,
  google_place_id TEXT,
  google_review_link TEXT,
  google_maps_link TEXT,
  num_followers INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zalo Customers
CREATE TABLE IF NOT EXISTS zalo_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oa_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  zalo_user_id TEXT,
  is_follower BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'reviewed', 'not_following')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  review_sent_at TIMESTAMPTZ,
  review_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(oa_id, phone)
);

-- Zalo Message History
CREATE TABLE IF NOT EXISTS zalo_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oa_id TEXT NOT NULL,
  customer_id UUID REFERENCES zalo_customers(id) ON DELETE CASCADE,
  zalo_user_id TEXT,
  message_id TEXT,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'button', 'review_request', 'welcome', 'promotion')),
  content TEXT,
  buttons JSONB,
  direction TEXT NOT NULL CHECK (direction IN ('outgoing', 'incoming')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review Request Batches
CREATE TABLE IF NOT EXISTS zalo_review_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oa_id TEXT NOT NULL,
  batch_name TEXT,
  total_customers INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Batch Results (link to messages)
CREATE TABLE IF NOT EXISTS zalo_batch_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES zalo_review_batches(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES zalo_customers(id) ON DELETE CASCADE,
  message_id UUID REFERENCES zalo_messages(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'not_following')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Templates
CREATE TABLE IF NOT EXISTS zalo_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oa_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('review_request', 'welcome', 'promotion', 'custom')),
  content TEXT NOT NULL,
  buttons JSONB,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_zalo_customers_oa ON zalo_customers(oa_id);
CREATE INDEX IF NOT EXISTS idx_zalo_customers_phone ON zalo_customers(phone);
CREATE INDEX IF NOT EXISTS idx_zalo_customers_status ON zalo_customers(status);
CREATE INDEX IF NOT EXISTS idx_zalo_messages_oa ON zalo_messages(oa_id);
CREATE INDEX IF NOT EXISTS idx_zalo_messages_customer ON zalo_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_zalo_batches_oa ON zalo_review_batches(oa_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_zalo_customers_updated_at ON zalo_customers;
CREATE TRIGGER update_zalo_customers_updated_at
  BEFORE UPDATE ON zalo_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_zalo_oa_config_updated_at ON zalo_oa_config;
CREATE TRIGGER update_zalo_oa_config_updated_at
  BEFORE UPDATE ON zalo_oa_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_zalo_templates_updated_at ON zalo_templates;
CREATE TRIGGER update_zalo_templates_updated_at
  BEFORE UPDATE ON zalo_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for admin app (single user)
ALTER TABLE zalo_oa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE zalo_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zalo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE zalo_review_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE zalo_batch_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE zalo_templates ENABLE ROW LEVEL SECURITY;

-- Allow all for authenticated users (admin app)
CREATE POLICY "Allow all for authenticated" ON zalo_oa_config FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON zalo_customers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON zalo_messages FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON zalo_review_batches FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON zalo_batch_results FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON zalo_templates FOR ALL USING (true);

-- Insert SABO Billiards OA config
INSERT INTO zalo_oa_config (
  oa_id,
  oa_name,
  app_id,
  business_name,
  business_phone,
  business_address,
  google_place_id,
  google_review_link,
  google_maps_link,
  num_followers
) VALUES (
  '3494355851305108700',
  'SABO Billiards',
  '576734226650074749',
  'SABO Billiards',
  '0329640232',
  '601A Nguyễn An Ninh, Vũng Tàu',
  'ChIJGTffkKhvdTERiIvpBbiMu8k',
  'https://g.page/r/CcmLuIW4i-kYEAE/review',
  'https://www.google.com/maps/place/?q=place_id:ChIJGTffkKhvdTERiIvpBbiMu8k',
  10
) ON CONFLICT DO NOTHING;

-- Insert default review request template
INSERT INTO zalo_templates (
  oa_id,
  name,
  type,
  content,
  buttons,
  is_active
) VALUES (
  '3494355851305108700',
  'Xin đánh giá 5 sao',
  'review_request',
  '🎱 Xin chào {name}!

Cảm ơn bạn đã đến chơi tại SABO Billiards!

⭐ Nếu hài lòng với dịch vụ, xin bạn dành 30 giây đánh giá 5 sao cho SABO nhé!

Mỗi đánh giá của bạn giúp SABO phục vụ tốt hơn! ❤️',
  '[{"type": "oa.open.url", "title": "⭐ Đánh giá 5 sao", "payload": {"url": "https://g.page/r/CcmLuIW4i-kYEAE/review"}}]',
  true
) ON CONFLICT DO NOTHING;
