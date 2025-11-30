import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function applyMigration(filePath, name) {
  console.log(`\n📄 Applying: ${name}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    await client.query(sql);
    console.log(`✅ ${name} applied successfully!`);
    return true;
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log(`⚠️ ${name} - already exists (skipping)`);
      return true;
    }
    console.log(`❌ ${name} failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying Phase 4 SQL Migrations...');
  console.log('=' .repeat(50));
  
  await client.connect();
  console.log('✅ Connected to database\n');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations', 'brain');
  
  const migrations = [
    { file: '008_knowledge_graph.sql', name: 'Migration 008: Knowledge Graph' },
    { file: '009_query_routing.sql', name: 'Migration 009: Query Routing' },
    { file: '010_master_brain_state.sql', name: 'Migration 010: Master Brain State' }
  ];
  
  let success = 0;
  let failed = 0;
  
  for (const m of migrations) {
    const result = await applyMigration(path.join(migrationsDir, m.file), m.name);
    if (result) success++;
    else failed++;
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 PHASE 4 MIGRATION RESULTS');
  console.log('=' .repeat(50));
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  
  // Verify
  console.log('\n📋 Verifying...');
  
  // Check tables
  const tables = ['brain_knowledge_graph_nodes', 'brain_knowledge_graph_edges', 'brain_query_routing', 'brain_routing_history', 'brain_master_session'];
  for (const table of tables) {
    const { rows } = await client.query(`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)
    `, [table]);
    console.log(`   ${table}: ${rows[0].exists ? '✅' : '❌'}`);
  }
  
  // Check functions
  const { rows: funcs } = await client.query(`
    SELECT routine_name FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('find_graph_paths', 'traverse_graph', 'select_relevant_domains', 'create_master_session', 'get_related_concepts', 'build_graph_from_knowledge')
  `);
  console.log(`\n   Functions: ${funcs.length} found`);
  funcs.forEach(f => console.log(`      - ${f.routine_name}`));
  
  await client.end();
  console.log('\n🎉 Phase 4 migrations complete!');
}

main();
