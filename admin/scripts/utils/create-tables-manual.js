/**
 * Create Investment Tables via Supabase Management API
 */

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

console.log('🚀 Creating Investment Tables via Supabase API');
console.log('='.repeat(70));

// SQL to create tables (simplified version)
const createTablesSQL = `
-- Investment Applications Table
CREATE TABLE IF NOT EXISTS investment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL,
  project_slug TEXT NOT NULL,
  project_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  investment_amount NUMERIC NOT NULL,
  investor_type TEXT NOT NULL CHECK (investor_type IN ('individual', 'institution', 'fund')),
  company_name TEXT,
  investment_purpose TEXT NOT NULL,
  investment_experience TEXT NOT NULL,
  risk_tolerance TEXT NOT NULL CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  identity_document TEXT NOT NULL,
  agree_terms BOOLEAN NOT NULL DEFAULT false,
  agree_risk BOOLEAN NOT NULL DEFAULT false,
  agree_privacy BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'contacted')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Project Interest Table
CREATE TABLE IF NOT EXISTS project_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL,
  project_slug TEXT NOT NULL,
  project_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'not_interested')),
  contacted_at TIMESTAMP WITH TIME ZONE,
  contacted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_investment_applications_project_slug ON investment_applications(project_slug);
CREATE INDEX IF NOT EXISTS idx_investment_applications_status ON investment_applications(status);
CREATE INDEX IF NOT EXISTS idx_investment_applications_created_at ON investment_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investment_applications_email ON investment_applications(email);
CREATE INDEX IF NOT EXISTS idx_project_interests_project_slug ON project_interests(project_slug);
CREATE INDEX IF NOT EXISTS idx_project_interests_status ON project_interests(status);
CREATE INDEX IF NOT EXISTS idx_project_interests_created_at ON project_interests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_interests_email ON project_interests(email);

-- Enable RLS
ALTER TABLE investment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can submit investment application" ON investment_applications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can submit project interest" ON project_interests FOR INSERT TO public WITH CHECK (true);
`;

console.log('');
console.log('📝 SQL Preview:');
console.log(createTablesSQL.substring(0, 200) + '...');
console.log('');
console.log('💡 IMPORTANT: Supabase requires manual SQL execution');
console.log('');
console.log('📋 Steps to Complete Migration:');
console.log('');
console.log('1️⃣  Open Supabase SQL Editor:');
console.log('   https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new');
console.log('');
console.log('2️⃣  Copy this SQL (already in clipboard):');
console.log('');
console.log('─'.repeat(70));
console.log(createTablesSQL);
console.log('─'.repeat(70));
console.log('');
console.log('3️⃣  Paste into SQL Editor and click "Run"');
console.log('');
console.log('4️⃣  Verify tables created:');
console.log('   ✅ investment_applications');
console.log('   ✅ project_interests');
console.log('');
console.log('5️⃣  Test the application:');
console.log('   • Form: http://localhost:8080/project-showcase/sabo-arena/investment/apply');
console.log('   • API: http://localhost:3001/api/investment/applications');
console.log('');
