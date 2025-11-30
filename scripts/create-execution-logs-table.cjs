const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://diexsbzqwsbpilsymnfb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY"
);

async function createExecutionLogsTable() {
  console.log("🔧 Creating workflow_execution_logs table...\n");

  // Create execution logs table
  const { error: createError } = await supabase.rpc("exec_sql", {
    sql: `
      -- Drop if exists for fresh start
      DROP TABLE IF EXISTS workflow_execution_logs CASCADE;
      
      -- Create execution logs table
      CREATE TABLE workflow_execution_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        instance_id UUID REFERENCES project_workflow_instances(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        input_data JSONB,
        output_data JSONB,
        execution_time_ms INTEGER,
        error_message TEXT,
        triggered_by VARCHAR(100) DEFAULT 'manual',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX idx_execution_logs_instance ON workflow_execution_logs(instance_id);
      CREATE INDEX idx_execution_logs_created ON workflow_execution_logs(created_at DESC);
      CREATE INDEX idx_execution_logs_status ON workflow_execution_logs(status);

      -- Enable RLS
      ALTER TABLE workflow_execution_logs ENABLE ROW LEVEL SECURITY;

      -- Allow all for authenticated users
      CREATE POLICY "Allow all for authenticated" ON workflow_execution_logs
        FOR ALL USING (true);
    `,
  });

  if (createError) {
    // Try direct insert to check if table exists
    console.log("Trying alternative approach...");

    const { error: checkError } = await supabase
      .from("workflow_execution_logs")
      .select("id")
      .limit(1);

    if (checkError?.code === "42P01") {
      console.log("❌ Table doesn't exist and RPC failed");
      console.log("Please run this SQL manually in Supabase:");
      console.log(`
CREATE TABLE workflow_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES project_workflow_instances(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  execution_time_ms INTEGER,
  error_message TEXT,
  triggered_by VARCHAR(100) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_execution_logs_instance ON workflow_execution_logs(instance_id);
CREATE INDEX idx_execution_logs_created ON workflow_execution_logs(created_at DESC);
      `);
      return;
    } else {
      console.log("✅ Table already exists!");
    }
  } else {
    console.log("✅ Created workflow_execution_logs table");
  }

  // Create RPC function for incrementing stats
  const { error: rpcError } = await supabase.rpc("exec_sql", {
    sql: `
      CREATE OR REPLACE FUNCTION increment_workflow_stats(
        p_instance_id UUID,
        p_success BOOLEAN,
        p_execution_time INTEGER
      ) RETURNS VOID AS $$
      BEGIN
        UPDATE project_workflow_instances
        SET 
          total_runs = COALESCE(total_runs, 0) + 1,
          successful_runs = CASE WHEN p_success THEN COALESCE(successful_runs, 0) + 1 ELSE COALESCE(successful_runs, 0) END,
          failed_runs = CASE WHEN NOT p_success THEN COALESCE(failed_runs, 0) + 1 ELSE COALESCE(failed_runs, 0) END,
          avg_execution_time_ms = (COALESCE(avg_execution_time_ms, 0) * COALESCE(total_runs, 0) + p_execution_time) / (COALESCE(total_runs, 0) + 1),
          last_run_at = NOW(),
          updated_at = NOW()
        WHERE id = p_instance_id;
      END;
      $$ LANGUAGE plpgsql;
    `,
  });

  if (rpcError) {
    console.log("⚠️  RPC function may already exist or failed:", rpcError.message);
  } else {
    console.log("✅ Created increment_workflow_stats function");
  }

  // Add missing columns to project_workflow_instances if needed
  const { error: alterError } = await supabase.rpc("exec_sql", {
    sql: `
      ALTER TABLE project_workflow_instances 
      ADD COLUMN IF NOT EXISTS total_runs INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS successful_runs INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS failed_runs INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS avg_execution_time_ms INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;
    `,
  });

  if (alterError) {
    console.log("⚠️  Columns may already exist:", alterError.message);
  } else {
    console.log("✅ Added stats columns to project_workflow_instances");
  }

  console.log("\n✅ Done!");
}

createExecutionLogsTable().catch(console.error);
