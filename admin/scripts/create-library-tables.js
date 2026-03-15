/**
 * 🚀 CREATE LIBRARY TABLES IN SUPABASE
 * Run: node scripts/create-library-tables.js
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://diexsbzqwsbpilsymnfb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY'
);

async function createTables() {
  console.log('🚀 Creating library tables...\n');

  // Test connection first
  const { data: testData, error: testError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (testError) {
    console.log('⚠️ Connection test:', testError.message);
  } else {
    console.log('✅ Supabase connection OK\n');
  }

  // Check if tables exist by trying to select from them
  console.log('📋 Checking existing tables...');
  
  const { error: workspaceCheck } = await supabase
    .from('library_workspace')
    .select('id')
    .limit(1);

  const { error: productsCheck } = await supabase
    .from('library_products')
    .select('id')
    .limit(1);

  const { error: activityCheck } = await supabase
    .from('library_activity_log')
    .select('id')
    .limit(1);

  console.log('library_workspace:', workspaceCheck ? '❌ Not exists' : '✅ Exists');
  console.log('library_products:', productsCheck ? '❌ Not exists' : '✅ Exists');
  console.log('library_activity_log:', activityCheck ? '❌ Not exists' : '✅ Exists');

  console.log('\n⚠️ To create tables, run SQL in Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new\n');
  
  console.log('='.repeat(60));
  console.log('COPY SQL BELOW:');
  console.log('='.repeat(60));
  console.log(`
-- =====================================================
-- LIBRARY WORKSPACE TABLE
-- Stores temporary working files (like a clipboard)
-- =====================================================
CREATE TABLE IF NOT EXISTS library_workspace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document', 'folder', 'other')),
  file_url TEXT,
  thumbnail_url TEXT,
  mime_type TEXT,
  parent_folder_id TEXT,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, file_id)
);

-- =====================================================
-- LIBRARY PRODUCTS TABLE
-- Stores finalized/approved media assets
-- =====================================================
CREATE TABLE IF NOT EXISTS library_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document', 'folder', 'other')),
  file_url TEXT,
  thumbnail_url TEXT,
  mime_type TEXT,
  parent_folder_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
  category TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  ai_tags TEXT[] DEFAULT '{}',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, file_id)
);

-- =====================================================
-- LIBRARY ACTIVITY LOG TABLE
-- Tracks all user actions for history/audit
-- =====================================================
CREATE TABLE IF NOT EXISTS library_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  item_count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_library_workspace_user ON library_workspace(user_id);
CREATE INDEX IF NOT EXISTS idx_library_workspace_added ON library_workspace(added_at DESC);

CREATE INDEX IF NOT EXISTS idx_library_products_user ON library_products(user_id);
CREATE INDEX IF NOT EXISTS idx_library_products_status ON library_products(status);
CREATE INDEX IF NOT EXISTS idx_library_products_added ON library_products(added_at DESC);

CREATE INDEX IF NOT EXISTS idx_library_activity_user ON library_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_library_activity_created ON library_activity_log(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE library_workspace ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_activity_log ENABLE ROW LEVEL SECURITY;

-- Workspace policies
CREATE POLICY "Users can view own workspace" ON library_workspace
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workspace" ON library_workspace
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workspace" ON library_workspace
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workspace" ON library_workspace
  FOR DELETE USING (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Users can view own products" ON library_products
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON library_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON library_products
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON library_products
  FOR DELETE USING (auth.uid() = user_id);

-- Activity log policies
CREATE POLICY "Users can view own activity" ON library_activity_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON library_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Service role bypass (for admin operations)
-- =====================================================
CREATE POLICY "Service role full access workspace" ON library_workspace
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access products" ON library_products
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access activity" ON library_activity_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

SELECT 'Tables created successfully!' as result;
  `);
  console.log('='.repeat(60));
}

createTables().catch(console.error);
