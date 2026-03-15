-- =====================================================
-- ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
-- =====================================================
-- Created: Dec 4, 2025
-- Purpose: Hệ thống phân quyền với role manager
-- =====================================================

-- =====================================================
-- Enum cho roles
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
    END IF;
END $$;

-- =====================================================
-- TABLE: project_members
-- Quản lý thành viên của từng project
-- =====================================================
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    -- owner: full control (edit, delete project)
    -- editor: can edit posts, view analytics
    -- viewer: read-only access
    permissions JSONB DEFAULT '[]', -- Custom permissions nếu cần
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- =====================================================
-- TABLE: user_profiles (optional - để lưu thêm info)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    system_role TEXT DEFAULT 'user' CHECK (system_role IN ('admin', 'manager', 'user')),
    -- admin: full system access
    -- manager: can manage assigned projects
    -- user: basic access
    department TEXT, -- Phòng ban
    position TEXT, -- Chức vụ
    phone TEXT,
    settings JSONB DEFAULT '{}',
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(system_role);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Project members policies
-- Admin có thể xem tất cả
CREATE POLICY "Admins can view all project members" ON project_members
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- User có thể xem project members của projects họ thuộc về
CREATE POLICY "Users can view their project members" ON project_members
    FOR SELECT 
    USING (
        user_id = auth.uid() OR
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- Chỉ admin và project owner mới có thể thêm members
CREATE POLICY "Admin and owners can insert project members" ON project_members
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = project_members.project_id 
            AND user_id = auth.uid() 
            AND role = 'owner'
        )
    );

-- Admin và owner có thể update
CREATE POLICY "Admin and owners can update project members" ON project_members
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_members.project_id 
            AND pm.user_id = auth.uid() 
            AND pm.role = 'owner'
        )
    );

-- Admin và owner có thể delete
CREATE POLICY "Admin and owners can delete project members" ON project_members
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_members.project_id 
            AND pm.user_id = auth.uid() 
            AND pm.role = 'owner'
        )
    );

-- User profiles policies
-- User có thể xem profile của mình
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (user_id = auth.uid());

-- Admin có thể xem tất cả profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- User có thể update profile của mình (trừ system_role)
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE 
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND
        (system_role IS NOT DISTINCT FROM (SELECT system_role FROM user_profiles WHERE user_id = auth.uid()))
    );

-- Chỉ admin mới có thể thay đổi system_role
CREATE POLICY "Admins can update any profile" ON user_profiles
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function để check user có quyền truy cập project không
CREATE OR REPLACE FUNCTION can_access_project(p_project_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_is_member BOOLEAN;
    v_is_owner BOOLEAN;
BEGIN
    -- Check if admin
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = p_user_id 
        AND raw_user_meta_data->>'role' = 'admin'
    ) INTO v_is_admin;
    
    IF v_is_admin THEN
        RETURN TRUE;
    END IF;
    
    -- Check if project owner
    SELECT EXISTS (
        SELECT 1 FROM projects 
        WHERE id = p_project_id 
        AND user_id = p_user_id
    ) INTO v_is_owner;
    
    IF v_is_owner THEN
        RETURN TRUE;
    END IF;
    
    -- Check if project member
    SELECT EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = p_project_id 
        AND user_id = p_user_id
    ) INTO v_is_member;
    
    RETURN v_is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function để get project role của user
CREATE OR REPLACE FUNCTION get_project_role(p_project_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
    v_is_admin BOOLEAN;
BEGIN
    -- Check if admin
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = p_user_id 
        AND raw_user_meta_data->>'role' = 'admin'
    ) INTO v_is_admin;
    
    IF v_is_admin THEN
        RETURN 'admin';
    END IF;
    
    -- Check if project owner
    IF EXISTS (SELECT 1 FROM projects WHERE id = p_project_id AND user_id = p_user_id) THEN
        RETURN 'owner';
    END IF;
    
    -- Get member role
    SELECT role INTO v_role
    FROM project_members 
    WHERE project_id = p_project_id 
    AND user_id = p_user_id;
    
    RETURN COALESCE(v_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers
-- =====================================================
CREATE TRIGGER update_project_members_updated_at
    BEFORE UPDATE ON project_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Create profile automatically when user signs up
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, display_name, system_role)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
