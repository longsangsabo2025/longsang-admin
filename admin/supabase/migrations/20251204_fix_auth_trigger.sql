-- =====================================================
-- FIX: Disable broken trigger để tạo user
-- Chạy SQL này trong Supabase SQL Editor:
-- https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new
-- =====================================================

-- Bước 1: Xóa trigger cũ đang gây lỗi
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Bước 2: Tạo bảng user_profiles nếu chưa có
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    system_role TEXT DEFAULT 'user' CHECK (system_role IN ('admin', 'manager', 'user')),
    department TEXT,
    position TEXT,
    phone TEXT,
    settings JSONB DEFAULT '{}',
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bước 3: Tạo lại trigger mới (không bắt buộc insert)
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
EXCEPTION WHEN OTHERS THEN
    -- Nếu có lỗi, vẫn cho phép tạo user
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bước 4: Gắn trigger lại (optional - comment nếu không muốn)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
