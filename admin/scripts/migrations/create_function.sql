CREATE OR REPLACE FUNCTION exec_raw_sql(query_text text)
RETURNS json AS 
BEGIN
    EXECUTE query_text;
    RETURN json_build_object('success', true, 'message', 'Query executed successfully');
EXCEPTION WHEN others THEN
    RETURN json_build_object('success', false, 'error', SQLERRM, 'error_code', SQLSTATE);
END;
 LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION exec_raw_sql(text) TO service_role;
