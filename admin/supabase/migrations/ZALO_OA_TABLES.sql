-- ============================================
-- ZALO OA TABLES FOR SABO BILLIARDS
-- Run this in Supabase Dashboard SQL Editor
-- https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql
-- ============================================

-- 1. Zalo OA Configuration
CREATE TABLE IF NOT EXISTS zalo_oa_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oa_id TEXT NOT NULL UNIQUE,
  oa_name TEXT NOT NULL,
  app_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_phone TEXT,
  business_address TEXT,
  google_review_link TEXT,
  num_followers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Zalo Customers
CREATE TABLE IF NOT EXISTS zalo_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oa_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  zalo_user_id TEXT,
  is_follower BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'reviewed', 'failed')),
  notes TEXT,
  last_sent_at TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(oa_id, phone)
);

-- 3. Zalo Message History
CREATE TABLE IF NOT EXISTS zalo_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oa_id TEXT NOT NULL,
  customer_id UUID REFERENCES zalo_customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  message_type TEXT NOT NULL CHECK (message_type IN ('review_request', 'promo', 'greeting', 'custom')),
  content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  zalo_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Batch Send Jobs
CREATE TABLE IF NOT EXISTS zalo_batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oa_id TEXT NOT NULL,
  batch_name TEXT,
  message_type TEXT NOT NULL,
  total_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_zalo_customers_oa ON zalo_customers(oa_id);
CREATE INDEX IF NOT EXISTS idx_zalo_customers_phone ON zalo_customers(phone);
CREATE INDEX IF NOT EXISTS idx_zalo_customers_status ON zalo_customers(status);
CREATE INDEX IF NOT EXISTS idx_zalo_messages_customer ON zalo_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_zalo_messages_oa ON zalo_messages(oa_id);

-- Enable RLS (Row Level Security)
ALTER TABLE zalo_oa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE zalo_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zalo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE zalo_batch_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (allow all)
CREATE POLICY "Allow all for service role" ON zalo_oa_config FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON zalo_customers FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON zalo_messages FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON zalo_batch_jobs FOR ALL USING (true);

-- ============================================
-- INITIAL DATA - SABO Billiards OA Config
-- ============================================
INSERT INTO zalo_oa_config (oa_id, oa_name, app_id, business_name, business_phone, business_address, google_review_link, num_followers)
VALUES (
  '3494355851305108700',
  'SABO Billiards',
  '576734226650074749',
  'SABO Billiards',
  '0329640232',
  '601A Nguyễn An Ninh, Vũng Tàu',
  'https://g.page/r/CcmLuIW4i-kYEAE/review',
  10
) ON CONFLICT (oa_id) DO UPDATE SET
  oa_name = EXCLUDED.oa_name,
  updated_at = NOW();

-- ============================================
-- INSERT 21 SAMPLE CUSTOMERS (first batch)
-- Full 101 customers will be imported via script
-- ============================================
INSERT INTO zalo_customers (oa_id, name, phone, status) VALUES
  ('3494355851305108700', 'TRẦN VĂN GIÀU', '0965098789', 'pending'),
  ('3494355851305108700', 'TRẦN VĂN CHẤT', '0943568098', 'pending'),
  ('3494355851305108700', 'NGÔ THANH DANH', '0707131393', 'pending'),
  ('3494355851305108700', 'ĐẶNG TUYỀN LONG', '0898009456', 'pending'),
  ('3494355851305108700', 'LÊ THANH HÙNG', '0913849099', 'pending'),
  ('3494355851305108700', 'TRẦN HÙNG', '0948989899', 'pending'),
  ('3494355851305108700', 'NGUYỄN VĂN SANG', '0859886186', 'pending'),
  ('3494355851305108700', 'NGUYỄN DUY LONG', '0888171000', 'pending'),
  ('3494355851305108700', 'VÕ THỊ HƯƠNG', '0979848898', 'pending'),
  ('3494355851305108700', 'ĐẶNG THỊ HẢO', '0359379599', 'pending'),
  ('3494355851305108700', 'LÊ THANH', '0946313368', 'pending'),
  ('3494355851305108700', 'CHÂU MINH HÒA', '0971100908', 'pending'),
  ('3494355851305108700', 'VŨ THỊ HUYỀN', '0985679797', 'pending'),
  ('3494355851305108700', 'VỪ A SỬ', '0972345286', 'pending'),
  ('3494355851305108700', 'CHUNG TIẾN PHONG', '0978080708', 'pending'),
  ('3494355851305108700', 'NGUYỄN VĂN BẢO', '0933343879', 'pending'),
  ('3494355851305108700', 'VŨ VĂN LỢI', '0978089398', 'pending'),
  ('3494355851305108700', 'NGUYỄN QUANG', '0943003004', 'pending'),
  ('3494355851305108700', 'HỒ VĂN ĐỂ', '0944242998', 'pending'),
  ('3494355851305108700', 'VĂN THỊ LỆ', '0969556968', 'pending'),
  ('3494355851305108700', 'LONG SANG', '0961167717', 'pending')
ON CONFLICT (oa_id, phone) DO NOTHING;

-- Verify
SELECT 
  'zalo_oa_config' as table_name, 
  COUNT(*) as count 
FROM zalo_oa_config
UNION ALL
SELECT 
  'zalo_customers' as table_name, 
  COUNT(*) as count 
FROM zalo_customers;
