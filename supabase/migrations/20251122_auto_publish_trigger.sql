-- ================================================
-- AUTO-PUBLISH TRIGGER FOR CONTENT QUEUE
-- ================================================
-- Automatically publish content to social media when added to queue

-- Create function to trigger auto-publish
CREATE OR REPLACE FUNCTION trigger_auto_publish
()
RETURNS TRIGGER AS $$
DECLARE
  v_settings JSONB;
  v_enabled BOOLEAN;
BEGIN
  -- Only process new content with status = 'pending'
  IF NEW.status != 'pending' OR TG_OP != 'INSERT' THEN
  RETURN NEW;
END
IF;

  -- Check if auto-publish is enabled
  SELECT value
INTO v_settings
FROM system_settings
WHERE key = 'auto_publish_settings';

IF v_settings IS NULL THEN
RETURN NEW;
END
IF;

  v_enabled :=
(v_settings->>'enabled')::BOOLEAN;

IF NOT v_enabled THEN
RETURN NEW;
END
IF;

  -- Call Edge Function to process auto-publish
  -- (Edge Function will handle the actual social media posting)
  PERFORM
    net.http_post
(
      url := current_setting
('app.settings.edge_function_url') || '/auto-publish',
      headers := jsonb_build_object
(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting
('app.settings.service_role_key')
      ),
      body := jsonb_build_object
(
        'content_id', NEW.id
      )
    );

RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on content_queue
DROP TRIGGER IF EXISTS on_content_queue_auto_publish
ON content_queue;

CREATE TRIGGER on_content_queue_auto_publish
  AFTER
INSERT ON
content_queue
FOR
EACH
ROW
EXECUTE FUNCTION trigger_auto_publish
();

-- Comment
COMMENT ON TRIGGER on_content_queue_auto_publish ON content_queue IS
'Triggers auto-publish when new content is added to queue';

COMMENT ON FUNCTION trigger_auto_publish
() IS
'Checks auto-publish settings and triggers Edge Function if enabled';
