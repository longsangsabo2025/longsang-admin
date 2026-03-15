/**
 * Script để update category cho ai_agents dựa trên type
 * Chạy trong Supabase SQL Editor hoặc qua script
 */

-- Map type sang category
UPDATE ai_agents SET category = 'content' WHERE type ILIKE '%content%' AND (category IS NULL OR category = '');
UPDATE ai_agents SET category = 'marketing' WHERE (type ILIKE '%marketing%' OR type ILIKE '%seo%' OR type ILIKE '%social%') AND (category IS NULL OR category = '');
UPDATE ai_agents SET category = 'analytics' WHERE (type ILIKE '%analyst%' OR type ILIKE '%analytics%' OR type ILIKE '%data%') AND (category IS NULL OR category = '');
UPDATE ai_agents SET category = 'automation' WHERE (type ILIKE '%automation%' OR type ILIKE '%workflow%' OR type ILIKE '%work_agent%') AND (category IS NULL OR category = '');
UPDATE ai_agents SET category = 'research' WHERE type ILIKE '%research%' AND (category IS NULL OR category = '');
UPDATE ai_agents SET category = 'support' WHERE (type ILIKE '%support%' OR type ILIKE '%customer%' OR type ILIKE '%service%') AND (category IS NULL OR category = '');

-- Set các agent còn lại là 'other'
UPDATE ai_agents SET category = 'other' WHERE category IS NULL OR category = '';

-- Kiểm tra kết quả
SELECT name, type, category FROM ai_agents ORDER BY category, name;
