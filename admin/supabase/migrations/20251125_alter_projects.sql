-- ============================================================
-- ALTER PROJECTS TABLE - Add missing columns
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add slug column (unique identifier for URL)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Add icon column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '📁';

-- Add color column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS color VARCHAR(100) DEFAULT 'from-blue-500 to-indigo-600';

-- Add URL columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS local_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS production_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url VARCHAR(500);

-- Update existing projects with slugs
UPDATE projects SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;

-- Make slug unique and not null
ALTER TABLE projects ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
