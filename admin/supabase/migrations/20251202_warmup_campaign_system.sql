-- ============================================
-- SABO CUSTOMER WARM-UP CAMPAIGN SYSTEM
-- Chiến lược làm nóng khách hàng cold
-- ============================================

-- 1. CAMPAIGNS - Quản lý chiến dịch
CREATE TABLE IF NOT EXISTS zalo_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oa_id TEXT NOT NULL,
  
  -- Campaign info
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('warmup', 'voucher', 'review_request', 'promotion', 'reminder')),
  
  -- Schedule
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Target audience
  target_segment TEXT DEFAULT 'all' CHECK (target_segment IN ('all', 'cold', 'warm', 'hot', 'vip', 'never_visited', 'custom')),
  target_filter JSONB DEFAULT '{}', -- Custom filters
  
  -- Message template
  message_template_id UUID,
  
  -- Stats
  total_targets INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  
  -- Settings
  delay_between_messages INTEGER DEFAULT 3000, -- ms between each message
  auto_followup BOOLEAN DEFAULT false,
  followup_days INTEGER DEFAULT 7,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VOUCHERS - Hệ thống voucher
CREATE TABLE IF NOT EXISTS zalo_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oa_id TEXT NOT NULL,
  campaign_id UUID REFERENCES zalo_campaigns(id) ON DELETE SET NULL,
  
  -- Voucher info
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  voucher_type TEXT NOT NULL CHECK (voucher_type IN ('free_time', 'discount_percent', 'discount_amount', 'free_drink', 'custom')),
  
  -- Value
  value INTEGER NOT NULL, -- 30 = 30 phút free, hoặc 10 = 10% discount
  value_unit TEXT DEFAULT 'minutes', -- minutes, percent, vnd
  min_spend INTEGER DEFAULT 0,
  max_discount INTEGER,
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Usage limits
  max_uses INTEGER DEFAULT 1, -- Per voucher code
  max_uses_per_customer INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted', 'cancelled')),
  
  -- Terms
  terms_conditions TEXT,
  applicable_days TEXT[] DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  applicable_hours TEXT, -- e.g., "09:00-22:00"
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMER VOUCHERS - Voucher assigned to customer
CREATE TABLE IF NOT EXISTS zalo_customer_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES zalo_vouchers(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES zalo_customers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES zalo_campaigns(id) ON DELETE SET NULL,
  
  -- Unique code for this customer
  personal_code TEXT NOT NULL UNIQUE,
  
  -- Status tracking
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'sent', 'viewed', 'used', 'expired')),
  
  -- Tracking timestamps
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  
  -- Usage details
  used_amount INTEGER, -- Actual discount given
  order_amount INTEGER, -- Total order when used
  
  UNIQUE(voucher_id, customer_id)
);

-- 4. MESSAGE TEMPLATES - Mẫu tin nhắn
CREATE TABLE IF NOT EXISTS zalo_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oa_id TEXT NOT NULL,
  
  -- Template info
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('warmup_voucher', 'voucher_reminder', 'review_request', 'thank_you', 'promotion', 'custom')),
  
  -- Content
  content TEXT NOT NULL,
  content_variables TEXT[] DEFAULT ARRAY['name', 'voucher_code', 'voucher_value', 'expiry_date'],
  
  -- Buttons (JSON array)
  buttons JSONB DEFAULT '[]',
  
  -- Preview
  preview_image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CAMPAIGN TARGETS - Khách hàng trong chiến dịch
CREATE TABLE IF NOT EXISTS zalo_campaign_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES zalo_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES zalo_customers(id) ON DELETE CASCADE,
  
  -- Status in this campaign
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'converted', 'failed', 'skipped')),
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Message details
  message_id TEXT,
  voucher_code TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, customer_id)
);

-- 6. TRACKING EVENTS - Chi tiết tracking
CREATE TABLE IF NOT EXISTS zalo_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  campaign_id UUID REFERENCES zalo_campaigns(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES zalo_customers(id) ON DELETE SET NULL,
  voucher_id UUID REFERENCES zalo_vouchers(id) ON DELETE SET NULL,
  message_id TEXT,
  
  -- Event info
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'voucher_viewed', 'voucher_used', 'followed', 'unfollowed', 'replied')),
  event_data JSONB DEFAULT '{}',
  
  -- Source
  source TEXT DEFAULT 'zalo_oa', -- zalo_oa, web, qr_scan
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Update zalo_customers với thêm fields
ALTER TABLE zalo_customers 
ADD COLUMN IF NOT EXISTS customer_segment TEXT DEFAULT 'cold' CHECK (customer_segment IN ('cold', 'warm', 'hot', 'vip')),
ADD COLUMN IF NOT EXISTS last_visit_date DATE,
ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spend INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_spend INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_visit_date DATE,
ADD COLUMN IF NOT EXISTS last_campaign_id UUID,
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opted_out BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS opt_out_reason TEXT;

-- ============= INDEXES =============
CREATE INDEX IF NOT EXISTS idx_campaigns_oa ON zalo_campaigns(oa_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON zalo_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON zalo_campaigns(campaign_type);

CREATE INDEX IF NOT EXISTS idx_vouchers_oa ON zalo_vouchers(oa_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON zalo_vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON zalo_vouchers(status);

CREATE INDEX IF NOT EXISTS idx_customer_vouchers_customer ON zalo_customer_vouchers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_status ON zalo_customer_vouchers(status);

CREATE INDEX IF NOT EXISTS idx_campaign_targets_campaign ON zalo_campaign_targets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_customer ON zalo_campaign_targets(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_status ON zalo_campaign_targets(status);

CREATE INDEX IF NOT EXISTS idx_tracking_campaign ON zalo_tracking_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tracking_customer ON zalo_tracking_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_tracking_type ON zalo_tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_created ON zalo_tracking_events(created_at);

CREATE INDEX IF NOT EXISTS idx_customers_segment ON zalo_customers(customer_segment);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON zalo_customers(last_visit_date);

-- ============= DEFAULT TEMPLATES =============
INSERT INTO zalo_message_templates (oa_id, name, template_type, content, buttons) VALUES
(
  '3494355851305108700',
  'Tặng voucher - Warm up',
  'warmup_voucher',
  '🎱 Xin chào {name}!

SABO Billiards gửi tặng bạn:

🎁 VOUCHER {voucher_value} PHÚT MIỄN PHÍ
📅 Có hiệu lực đến {expiry_date}

Mã voucher: {voucher_code}

📍 601A Nguyễn An Ninh, Vũng Tàu
📞 0329 640 232

Hẹn gặp bạn tại SABO! 🎯',
  '[{"type": "oa.open.url", "title": "🎁 Nhận voucher", "payload": {"url": "https://sabo.vn/voucher/{voucher_code}"}}, {"type": "oa.open.url", "title": "📍 Chỉ đường", "payload": {"url": "https://g.page/r/CcmLuIW4i-kYEAE"}}]'
),
(
  '3494355851305108700',
  'Nhắc voucher sắp hết hạn',
  'voucher_reminder',
  '⏰ {name} ơi!

Voucher {voucher_value} phút FREE của bạn sắp hết hạn!

📅 Còn {days_left} ngày
🎫 Mã: {voucher_code}

Đừng bỏ lỡ nhé! 🎱',
  '[{"type": "oa.open.url", "title": "🎁 Dùng voucher ngay", "payload": {"url": "https://sabo.vn/voucher/{voucher_code}"}}]'
),
(
  '3494355851305108700',
  'Cảm ơn + Xin review',
  'review_request',
  '🎱 Cảm ơn {name} đã ghé SABO!

Hy vọng bạn đã có trải nghiệm tuyệt vời 🌟

Nếu hài lòng, bạn có thể ủng hộ SABO bằng 1 đánh giá 5⭐ được không? 

Mỗi đánh giá giúp SABO phục vụ tốt hơn! 🙏❤️',
  '[{"type": "oa.open.url", "title": "⭐ Đánh giá 5 sao", "payload": {"url": "https://g.page/r/CcmLuIW4i-kYEAE/review"}}]'
),
(
  '3494355851305108700',
  'Cảm ơn đã dùng voucher',
  'thank_you',
  '🎉 Cảm ơn {name} đã sử dụng voucher!

Rất vui được phục vụ bạn tại SABO 🎱

Hẹn gặp lại bạn lần sau nhé! 💚',
  '[]'
)
ON CONFLICT DO NOTHING;

-- ============= DEFAULT CAMPAIGN: Warm Up Cold Customers =============
INSERT INTO zalo_campaigns (
  oa_id, 
  name, 
  description, 
  campaign_type, 
  status, 
  target_segment,
  delay_between_messages,
  auto_followup,
  followup_days
) VALUES (
  '3494355851305108700',
  '🔥 Warm Up Cold Customers - Tháng 12/2025',
  'Chiến dịch làm nóng lại 101 khách hàng cũ bằng voucher 30 phút free. Không spam, value first.',
  'warmup',
  'draft',
  'cold',
  3000,
  true,
  7
) ON CONFLICT DO NOTHING;

-- ============= VERIFY =============
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'zalo_%';
