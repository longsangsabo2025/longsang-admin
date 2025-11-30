import { Client } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

const TEST_USER_ID = '6490f4e9-ed96-4121-9c70-bb4ad1feb71d';

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 COMPREHENSIVE BRAIN MIGRATION TEST');
  console.log('=====================================\n');

  await client.connect();
  console.log('✅ Connected to database\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  // ==========================================
  // PHASE 1-2: Core Tables
  // ==========================================
  console.log('📦 PHASE 1-2: Core Tables');
  console.log('-----------------------------------------');

  // Test brain_domains
  if (await test('brain_domains - SELECT', async () => {
    await client.query('SELECT * FROM brain_domains LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_domains SELECT'); }

  if (await test('brain_domains - INSERT', async () => {
    const res = await client.query(`
      INSERT INTO brain_domains (name, description, user_id)
      VALUES ('Test Domain', 'Test Description', $1)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [TEST_USER_ID]);
  })) passed++; else { failed++; failures.push('brain_domains INSERT'); }

  // Test brain_knowledge
  if (await test('brain_knowledge - SELECT', async () => {
    await client.query('SELECT * FROM brain_knowledge LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_knowledge SELECT'); }

  // Test brain_memory
  if (await test('brain_memory - SELECT', async () => {
    await client.query('SELECT * FROM brain_memory LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_memory SELECT'); }

  // Test brain_query_history
  if (await test('brain_query_history - SELECT', async () => {
    await client.query('SELECT * FROM brain_query_history LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_query_history SELECT'); }

  // Test brain_core_logic
  if (await test('brain_core_logic - SELECT', async () => {
    await client.query('SELECT * FROM brain_core_logic LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_core_logic SELECT'); }

  // ==========================================
  // PHASE 3: Vector Search & Stats
  // ==========================================
  console.log('\n📦 PHASE 3: Vector Search & Stats');
  console.log('-----------------------------------------');

  // Test search_knowledge function
  if (await test('search_knowledge function', async () => {
    // Create a test embedding (1536 dimensions)
    const embedding = Array(1536).fill(0.01);
    // Function signature: query_embedding vector, p_user_id text, p_category text, p_project_id uuid, match_threshold float, match_count int
    await client.query(`SELECT * FROM search_knowledge($1::vector)`, [`[${embedding.join(',')}]`]);
  })) passed++; else { failed++; failures.push('search_knowledge function'); }

  // Test brain_domain_stats
  if (await test('brain_domain_stats - SELECT', async () => {
    await client.query('SELECT * FROM brain_domain_stats LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_domain_stats SELECT'); }

  // Test update_domain_stats function
  if (await test('update_domain_stats function', async () => {
    const domain = await client.query('SELECT id FROM brain_domains WHERE user_id = $1 LIMIT 1', [TEST_USER_ID]);
    if (domain.rows.length > 0) {
      await client.query('SELECT update_domain_stats($1)', [domain.rows[0].id]);
    }
  })) passed++; else { failed++; failures.push('update_domain_stats function'); }

  // ==========================================
  // PHASE 3: Core Logic Queue & Versioning
  // ==========================================
  console.log('\n📦 PHASE 3: Core Logic Queue & Versioning');
  console.log('-----------------------------------------');

  // Test brain_core_logic_queue
  if (await test('brain_core_logic_queue - SELECT', async () => {
    await client.query('SELECT * FROM brain_core_logic_queue LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_core_logic_queue SELECT'); }

  // Test brain_core_logic_version_history
  if (await test('brain_core_logic_version_history - SELECT', async () => {
    await client.query('SELECT * FROM brain_core_logic_version_history LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_core_logic_version_history SELECT'); }

  // ==========================================
  // PHASE 4: Knowledge Graph
  // ==========================================
  console.log('\n📦 PHASE 4: Knowledge Graph');
  console.log('-----------------------------------------');

  // Test brain_knowledge_graph_nodes
  if (await test('brain_knowledge_graph_nodes - SELECT', async () => {
    await client.query('SELECT * FROM brain_knowledge_graph_nodes LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_knowledge_graph_nodes SELECT'); }

  // Test brain_knowledge_graph_edges
  if (await test('brain_knowledge_graph_edges - SELECT', async () => {
    await client.query('SELECT * FROM brain_knowledge_graph_edges LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_knowledge_graph_edges SELECT'); }

  // Test graph functions
  if (await test('build_graph_from_knowledge function', async () => {
    const domain = await client.query('SELECT id FROM brain_domains WHERE user_id = $1 LIMIT 1', [TEST_USER_ID]);
    if (domain.rows.length > 0) {
      await client.query('SELECT build_graph_from_knowledge($1, $2)', [domain.rows[0].id, TEST_USER_ID]);
    }
  })) passed++; else { failed++; failures.push('build_graph_from_knowledge function'); }

  // ==========================================
  // PHASE 4: Query Routing
  // ==========================================
  console.log('\n📦 PHASE 4: Query Routing');
  console.log('-----------------------------------------');

  // Test brain_query_routing
  if (await test('brain_query_routing - SELECT', async () => {
    await client.query('SELECT * FROM brain_query_routing LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_query_routing SELECT'); }

  // Test brain_routing_performance
  if (await test('brain_routing_performance - SELECT', async () => {
    await client.query('SELECT * FROM brain_routing_performance LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_routing_performance SELECT'); }

  // Test select_relevant_domains function
  if (await test('select_relevant_domains function', async () => {
    const embedding = Array(1536).fill(0.01);
    // Function signature: p_query_text text, p_query_embedding vector, p_user_id uuid, p_max_domains int, p_min_score float
    await client.query(
      `SELECT * FROM select_relevant_domains($1, $2::vector, $3::uuid)`,
      ['test query', `[${embedding.join(',')}]`, TEST_USER_ID]
    );
  })) passed++; else { failed++; failures.push('select_relevant_domains function'); }

  // ==========================================
  // PHASE 4: Master Brain State
  // ==========================================
  console.log('\n📦 PHASE 4: Master Brain State');
  console.log('-----------------------------------------');

  // Test brain_master_session
  if (await test('brain_master_session - SELECT', async () => {
    await client.query('SELECT * FROM brain_master_session LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_master_session SELECT'); }

  // Test brain_multi_domain_context
  if (await test('brain_multi_domain_context - SELECT', async () => {
    await client.query('SELECT * FROM brain_multi_domain_context LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_multi_domain_context SELECT'); }

  // Test brain_orchestration_state
  if (await test('brain_orchestration_state - SELECT', async () => {
    await client.query('SELECT * FROM brain_orchestration_state LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_orchestration_state SELECT'); }

  // Test create_master_session function
  if (await test('create_master_session function', async () => {
    const domain = await client.query('SELECT id FROM brain_domains WHERE user_id = $1 LIMIT 1', [TEST_USER_ID]);
    if (domain.rows.length > 0) {
      await client.query(
        'SELECT create_master_session($1, $2, $3, $4)',
        ['Test Session', [domain.rows[0].id], TEST_USER_ID, 'conversation']
      );
    }
  })) passed++; else { failed++; failures.push('create_master_session function'); }

  // ==========================================
  // PHASE 5: Actions & Workflows
  // ==========================================
  console.log('\n📦 PHASE 5: Actions & Workflows');
  console.log('-----------------------------------------');

  // Test brain_actions
  if (await test('brain_actions - SELECT', async () => {
    await client.query('SELECT * FROM brain_actions LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_actions SELECT'); }

  if (await test('brain_actions - INSERT', async () => {
    await client.query(`
      INSERT INTO brain_actions (user_id, action_type, payload, status)
      VALUES ($1, 'test_action', '{"test": true}', 'pending')
      RETURNING id
    `, [TEST_USER_ID]);
  })) passed++; else { failed++; failures.push('brain_actions INSERT'); }

  // Test brain_workflows
  if (await test('brain_workflows - SELECT', async () => {
    await client.query('SELECT * FROM brain_workflows LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_workflows SELECT'); }

  if (await test('brain_workflows - INSERT', async () => {
    await client.query(`
      INSERT INTO brain_workflows (user_id, name, actions, trigger_type, is_active)
      VALUES ($1, 'Test Workflow', '[{"step": 1}]', 'manual', true)
      RETURNING id
    `, [TEST_USER_ID]);
  })) passed++; else { failed++; failures.push('brain_workflows INSERT'); }

  // ==========================================
  // PHASE 5: Tasks & Notifications
  // ==========================================
  console.log('\n📦 PHASE 5: Tasks & Notifications');
  console.log('-----------------------------------------');

  // Test brain_tasks
  if (await test('brain_tasks - SELECT', async () => {
    await client.query('SELECT * FROM brain_tasks LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_tasks SELECT'); }

  if (await test('brain_tasks - INSERT', async () => {
    await client.query(`
      INSERT INTO brain_tasks (user_id, title, description, status, priority)
      VALUES ($1, 'Test Task', 'Test task description', 'pending', 'medium')
      RETURNING id
    `, [TEST_USER_ID]);
  })) passed++; else { failed++; failures.push('brain_tasks INSERT'); }

  // Test brain_notifications
  if (await test('brain_notifications - SELECT', async () => {
    await client.query('SELECT * FROM brain_notifications LIMIT 1');
  })) passed++; else { failed++; failures.push('brain_notifications SELECT'); }

  if (await test('brain_notifications - INSERT', async () => {
    await client.query(`
      INSERT INTO brain_notifications (user_id, type, message)
      VALUES ($1, 'info', 'This is a test notification')
      RETURNING id
    `, [TEST_USER_ID]);
  })) passed++; else { failed++; failures.push('brain_notifications INSERT'); }

  // ==========================================
  // RLS Verification
  // ==========================================
  console.log('\n🔒 RLS Verification');
  console.log('-----------------------------------------');

  const rlsTables = [
    'brain_domains', 'brain_knowledge', 'brain_memory', 'brain_core_logic',
    'brain_actions', 'brain_workflows', 'brain_tasks', 'brain_notifications',
    'brain_master_session', 'brain_orchestration_state'
  ];

  for (const table of rlsTables) {
    if (await test(`${table} - RLS enabled`, async () => {
      const res = await client.query(`
        SELECT rowsecurity FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = $1
      `, [table]);
      if (!res.rows[0]?.rowsecurity) throw new Error('RLS not enabled');
    })) passed++; else { failed++; failures.push(`${table} RLS`); }
  }

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n=====================================');
  console.log('📊 TEST SUMMARY');
  console.log('=====================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failures.length > 0) {
    console.log('\n❌ Failed Tests:');
    failures.forEach(f => console.log(`   - ${f}`));
  }

  await client.end();

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Brain migrations are 100% functional!');
  } else {
    console.log('\n⚠️ Some tests failed. Review and fix the issues above.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  client.end();
  process.exit(1);
});
