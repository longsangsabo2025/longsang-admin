// Fix RLS Policy cho App Showcase
import pkg from 'pg';
const { Client } = pkg;

const connectionConfig = {
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.diexsbzqwsbpilsymnfb',
  password: 'Acookingoil123',
  ssl: { rejectUnauthorized: false }
};

const fixPolicies = `
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert apps" ON app_showcase;
DROP POLICY IF EXISTS "Authenticated users can update apps" ON app_showcase;

-- Allow anon to insert and update (for admin without auth)
CREATE POLICY "Allow anon insert"
ON app_showcase
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update"
ON app_showcase
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Keep authenticated access
CREATE POLICY "Allow authenticated insert"
ON app_showcase
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update"
ON app_showcase
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
`;

async function fix() {
  const client = new Client(connectionConfig);
  try {
    console.log('🔧 Fixing RLS policies...');
    await client.connect();
    await client.query(fixPolicies);
    console.log('✅ RLS policies fixed! Admin can now save data.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fix();
