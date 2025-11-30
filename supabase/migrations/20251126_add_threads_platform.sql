-- ================================================
-- ADD THREADS PLATFORM TO SOCIAL MEDIA CREDENTIALS
-- ================================================
-- Migration to add 'threads' as a valid platform

-- First, drop the constraint
ALTER TABLE social_media_credentials 
DROP CONSTRAINT IF EXISTS social_media_credentials_platform_check;

-- Add new constraint with threads included
ALTER TABLE social_media_credentials 
ADD CONSTRAINT social_media_credentials_platform_check 
CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'telegram', 'discord', 'threads'));

-- Verify the change
SELECT DISTINCT platform FROM social_media_credentials;
