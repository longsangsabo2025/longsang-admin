-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant permissions to postgres role
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres;
