
CREATE OR REPLACE FUNCTION exec_raw_sql(query text)
RETURNS json AS 
DECLARE
    result json;
BEGIN
    -- Execute the dynamic SQL and return result as JSON
    EXECUTE query;
    
    -- Return success message
    SELECT json_build_object('success', true, 'message', 'Query executed successfully') INTO result;
    
    RETURN result;
    
EXCEPTION WHEN others THEN
    -- Return error information
    SELECT json_build_object(
        'success', false, 
        'error', SQLERRM,
        'error_code', SQLSTATE
    ) INTO result;
    
    RETURN result;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION exec_raw_sql(text) TO service_role;

-- Create a simplified version for public use (with restrictions)
CREATE OR REPLACE FUNCTION exec_safe_sql(query text)
RETURNS json AS 
DECLARE
    result json;
    allowed_operations text[] := ARRAY['CREATE TABLE', 'CREATE INDEX', 'ALTER TABLE', 'CREATE POLICY'];
    operation_found boolean := false;
    op text;
BEGIN
    -- Check if query starts with allowed operations
    FOREACH op IN ARRAY allowed_operations LOOP
        IF upper(trim(query)) LIKE upper(op) || '%' THEN
            operation_found := true;
            EXIT;
        END IF;
    END LOOP;
    
    IF NOT operation_found THEN
        SELECT json_build_object('success', false, 'error', 'Operation not allowed') INTO result;
        RETURN result;
    END IF;
    
    -- Execute the query
    EXECUTE query;
    
    SELECT json_build_object('success', true, 'message', 'Query executed successfully') INTO result;
    RETURN result;
    
EXCEPTION WHEN others THEN
    SELECT json_build_object(
        'success', false, 
        'error', SQLERRM,
        'error_code', SQLSTATE
    ) INTO result;
    
    RETURN result;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to public for safe function
GRANT EXECUTE ON FUNCTION exec_safe_sql(text) TO anon, authenticated;

