import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.execution_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        command TEXT NOT NULL,
        steps JSONB DEFAULT '[]'::jsonb,
        duration INTEGER,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        error TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ Table execution_history created successfully!');
    
    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_execution_history_user_id ON public.execution_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_execution_history_created_at ON public.execution_history(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_execution_history_status ON public.execution_history(status);
    `);
    console.log('✅ Indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTable();
