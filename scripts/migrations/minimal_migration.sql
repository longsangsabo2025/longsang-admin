
-- INVESTMENT PORTAL TABLES
-- Copy this entire block and paste in Supabase SQL Editor

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
    investor_type TEXT CHECK (investor_type IN ('individual', 'institution', 'fund')),
    company_name TEXT,
    investment_purpose TEXT NOT NULL,
    investment_experience TEXT NOT NULL,
    risk_tolerance TEXT CHECK (risk_tolerance IN ('low', 'medium', 'high')),
    identity_document TEXT NOT NULL,
    agree_terms BOOLEAN DEFAULT false,
    agree_risk BOOLEAN DEFAULT false,
    agree_privacy BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'contacted')),
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
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'not_interested')),
    contacted_at TIMESTAMP WITH TIME ZONE,
    contacted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE investment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_interests ENABLE ROW LEVEL SECURITY;

-- Allow public to insert applications
CREATE POLICY "Public can submit applications" ON investment_applications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can submit interests" ON project_interests FOR INSERT TO public WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_investment_applications_project_slug ON investment_applications(project_slug);
CREATE INDEX IF NOT EXISTS idx_investment_applications_status ON investment_applications(status);
CREATE INDEX IF NOT EXISTS idx_project_interests_project_slug ON project_interests(project_slug);
CREATE INDEX IF NOT EXISTS idx_project_interests_status ON project_interests(status);

