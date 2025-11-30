-- Database Function: Auto-create marketing campaigns from AI-generated content
-- This trigger automatically creates social media campaigns when blog posts are generated

-- Create function to auto-create marketing campaign
CREATE OR REPLACE FUNCTION auto_create_marketing_campaign
()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_campaign_id UUID;
  v_social_snippet TEXT;
  v_scheduled_time TIMESTAMPTZ;
BEGIN
  -- Only process blog posts with content
  IF NEW.content_type = 'blog_post'
    AND NEW.status = 'pending'
    AND NEW.content IS NOT NULL
    AND LENGTH(NEW.content) > 100 THEN

  -- Get first user (or specific user from metadata)
  SELECT id
  INTO v_user_id
  FROM auth.users
  ORDER BY created_at
    LIMIT 1;

    IF v_user_id
  IS NULL THEN
  RETURN NEW;
END
IF;

    -- Extract social media snippet (first 280 chars)
    v_social_snippet := SUBSTRING
(
      REGEXP_REPLACE
(NEW.content, '[#*\n]+', ' ', 'g'),
      1, 280
    );

    -- Schedule for 15 minutes from now
    v_scheduled_time := NOW
() + INTERVAL '15 minutes';

-- Create marketing campaign
INSERT INTO marketing_campaigns
  (
  user_id,
  name,
  type,
  status,
  content,
  platforms,
  scheduled_at,
  target_audience
  )
VALUES
  (
    v_user_id,
    'AUTO: ' || NEW.title,
    'social_media',
    'scheduled',
    '📝 ' || NEW.title || E
'\n\n' || v_social_snippet || E'\n\n🔗 Read full article',
      ARRAY['linkedin', 'facebook'],
      v_scheduled_time,
      jsonb_build_object
(
        'source', 'ai_generated',
        'content_queue_id', NEW.id,
        'topic', COALESCE
(NEW.metadata->>'topic', 'general'),
        'automated', true
      )
    ) RETURNING id INTO v_campaign_id;

-- Create individual posts for each platform
INSERT INTO campaign_posts
  (campaign_id, platform, content, status)
SELECT
  v_campaign_id,
  unnest(ARRAY['linkedin', 'facebook']),
  '📝 ' || NEW.title || E'\n\n'
|| v_social_snippet || E'\n\n🔗 Read more',
      'pending';

    -- Update content_queue with campaign reference
    NEW.metadata := jsonb_set
(
      COALESCE
(NEW.metadata, '{}'::jsonb),
      '{marketing_campaign_id}',
      to_jsonb
(v_campaign_id::TEXT)
    );

-- Log activity
INSERT INTO activity_logs
  (action, status, details)
VALUES
  (
    'campaign_auto_created',
    'success',
    jsonb_build_object(
        'content_queue_id', NEW.id,
        'campaign_id', v_campaign_id,
        'platforms', ARRAY['linkedin', 'facebook'],
        'scheduled_at', v_scheduled_time
      )
    );

RAISE NOTICE 'Auto-created marketing campaign: %', v_campaign_id;
END
IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on content_queue
DROP TRIGGER IF EXISTS on_blog_post_created
ON content_queue;

CREATE TRIGGER on_blog_post_created
  AFTER
INSERT ON
content_queue
FOR
EACH
ROW
EXECUTE FUNCTION auto_create_marketing_campaign
();

-- Add indexes for performance
CREATE INDEX
IF NOT EXISTS idx_content_queue_type_status
  ON content_queue
(content_type, status)
  WHERE content_type = 'blog_post';

CREATE INDEX
IF NOT EXISTS idx_marketing_campaigns_scheduled
  ON marketing_campaigns
(scheduled_at)
  WHERE status = 'scheduled';

CREATE INDEX
IF NOT EXISTS idx_campaign_posts_status
  ON campaign_posts
(status)
  WHERE status = 'pending';

COMMENT ON FUNCTION auto_create_marketing_campaign
() IS
  'Automatically creates social media marketing campaigns when AI generates blog posts from contact forms';

COMMENT ON TRIGGER on_blog_post_created ON content_queue IS
  'Triggers marketing campaign creation when new blog post is added to queue';
