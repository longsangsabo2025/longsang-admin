-- MINIMAL INVESTMENT TABLES
CREATE TABLE investment_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id INTEGER NOT NULL,
    project_slug TEXT NOT NULL,
    project_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    investment_amount NUMERIC NOT NULL,
    investor_type TEXT NOT NULL,
    company_name TEXT,
    investment_purpose TEXT NOT NULL,
    investment_experience TEXT NOT NULL,
    risk_tolerance TEXT NOT NULL,
    identity_document TEXT NOT NULL,
    agree_terms BOOLEAN DEFAULT false,
    agree_risk BOOLEAN DEFAULT false,
    agree_privacy BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID
);

CREATE TABLE project_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id INTEGER NOT NULL,
    project_slug TEXT NOT NULL,
    project_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'new',
    contacted_at TIMESTAMP WITH TIME ZONE,
    contacted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE investment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert applications" ON investment_applications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can insert interests" ON project_interests FOR INSERT TO public WITH CHECK (true);